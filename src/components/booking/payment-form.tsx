"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Building2,
    CreditCard,
    Globe2,
    Landmark,
    Loader2,
    Phone,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { getStripe } from '@/lib/stripe';
import { resolveCheckoutReturnUrlForRequest } from '@/lib/checkout-return-url';
import { useTranslations } from '@/components/providers/locale-provider';
import {
    PAYMENT_CHANNELS,
    type PaymentChannelId,
    isLocalPaymentChannel,
} from '@/lib/payment-channels';
import {
    isValidMpgsSessionId,
    resolveTrustedMpgsCheckoutScriptUrl,
} from '@/lib/mpgs-checkout-security';
import {
    buildLocalCheckoutMetadata,
    etMsisdnToLocalDisplay,
    ET_MOBILE_PATTERN,
    fetchPaymentStatus,
} from '@/lib/local-payment-checkout';

const USE_MPGS_CHECKOUT = process.env.NEXT_PUBLIC_MPGS_ENABLED === 'true';

interface PaymentFormProps {
    amount: number;
    onSuccess: (method: PaymentMethod) => void;
    onCancel: () => void;
    isLocal?: boolean; // New prop to determine if local methods (Telebirr/CBE) should be shown
    // Optional metadata for Stripe backend spec
    bookingType?: 'flight' | 'hotel' | 'event' | 'car';
    source?: string; // e.g., 'amadeus', 'duffel', 'local'
    externalItemId?: string; // ID from provider/search result
    currencyCode?: string; // default USD
    externalSnapshot?: Record<string, any>;
    /** E.164 or local ET number from booking form — pre-fills CBE Birr USSD phone. */
    customerPhone?: string;
}

type PaymentMethod = 'telebirr' | 'cbebirr' | 'stripe' | 'mpgs' | 'pay_on_site';

const defaultCardMethod = (): PaymentMethod =>
    USE_MPGS_CHECKOUT ? 'mpgs' : 'stripe';

// Local Ethiopian rails are available by default; set NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED=false to hide globally.
const SHOW_LOCAL_PAYMENT_METHODS =
    process.env.NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED !== 'false';

/**
 * Best-effort guess of whether the visitor is physically in Ethiopia, so we only
 * offer local ETB rails (CBE Birr, etc.) to people who can actually use them.
 * A visitor in Kenya, for example, falls through to international cards (Stripe / MPGS).
 * Amharic locale ⇒ Ethiopian; otherwise we read the browser timezone.
 */
export function detectEthiopianVisitor(locale: string): boolean {
    if (locale === 'am') return true;
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Addis_Ababa';
    } catch {
        return false;
    }
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
    amount,
    onSuccess,
    onCancel,
    isLocal = true,
    bookingType = 'flight',
    source = 'local',
    externalItemId = 'N/A',
    currencyCode = 'USD',
    externalSnapshot = {},
    customerPhone = '',
}) => {
    const { t, locale } = useTranslations();

    const telebirrSchema = useMemo(
        () =>
            z.object({
                phone: z.string().regex(/^(09|07)\d{8}$/, t('bookingUi.payment.validationTelebirr')),
            }),
        [t],
    );

    const localChannels = PAYMENT_CHANNELS.filter((c) => c.id !== 'stripe');
    const [method, setMethod] = useState<PaymentMethod>(
        SHOW_LOCAL_PAYMENT_METHODS && isLocal ? 'cbebirr' : defaultCardMethod(),
    );
    const [paymentChannel, setPaymentChannel] = useState<PaymentChannelId>(
        SHOW_LOCAL_PAYMENT_METHODS && isLocal ? 'cbe_birr' : 'stripe',
    );
    const [loading, setLoading] = useState(false);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const [ussdInstructions, setUssdInstructions] = useState<string | null>(null);
    const [awaitingBankPayment, setAwaitingBankPayment] = useState(false);
    // CBE Birr (and future local banks) collect an Ethiopian mobile number to receive the USSD push.
    const [localPhone, setLocalPhone] = useState('');
    const [localPhoneError, setLocalPhoneError] = useState<string | null>(null);
    const [etbQuoteAmount, setEtbQuoteAmount] = useState<number | null>(null);
    const [etbQuoteLoading, setEtbQuoteLoading] = useState(false);
    // Seed from locale (deterministic for SSR), then refine with the browser timezone after mount.
    const [visitorIsEthiopian, setVisitorIsEthiopian] = useState<boolean>(locale === 'am');
    // Which group is currently shown. Local and International are mutually exclusive in the UI:
    // selecting one hides the other (cleaner, less cluttered checkout).
    const [activeGroup, setActiveGroup] = useState<'local' | 'international'>(
        SHOW_LOCAL_PAYMENT_METHODS && isLocal ? 'local' : 'international',
    );

    // The currently selected local bank config (drives logo + accent color for its checkout panel).
    const activeLocalChannel = useMemo(
        () => localChannels.find((c) => c.id === paymentChannel) ?? localChannels[0],
        [localChannels, paymentChannel],
    );

    useEffect(() => {
        setVisitorIsEthiopian(detectEthiopianVisitor(locale));
    }, [locale]);

    const selectMethod = useCallback((next: PaymentMethod) => {
        setMethod(next);
        setPaymentReference(null);
        setUssdInstructions(null);
        setLocalPhoneError(null);
        setAwaitingBankPayment(false);
    }, []);

    // Switch between the Local and International groups. Each switch also selects that
    // group's default method so the action panel below always matches what's visible.
    const selectGroup = useCallback(
        (group: 'local' | 'international') => {
            setActiveGroup(group);
            if (group === 'local') {
                const first = localChannels[0]?.id ?? 'cbe_birr';
                setPaymentChannel(first);
                selectMethod('cbebirr');
            } else {
                setPaymentChannel('stripe');
                selectMethod(defaultCardMethod());
            }
        },
        [localChannels, selectMethod],
    );

    // Pre-fill USSD phone from booking form (+251… → 09…).
    useEffect(() => {
        const local = etMsisdnToLocalDisplay(customerPhone);
        if (local && ET_MOBILE_PATTERN.test(local)) {
            setLocalPhone(local);
        }
    }, [customerPhone]);

    // Persist ?returnUrl= from BookAddis embed/link for Stripe cancel/success redirects
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const params = new URLSearchParams(window.location.search);
            const r = params.get('returnUrl');
            if (!r) return;
            const decoded = (() => {
                try {
                    return decodeURIComponent(r);
                } catch {
                    return r;
                }
            })();
            sessionStorage.setItem('checkout_return_url', decoded);
        } catch {
            /* ignore */
        }
    }, []);

    const currency =
        method === 'telebirr' || method === 'cbebirr' ? 'ETB' : currencyCode || 'USD';
    const localFallbackEtb = amount * 55;
    const displayAmount =
        method === 'telebirr' || method === 'cbebirr'
            ? etbQuoteAmount ?? localFallbackEtb
            : amount;

    const telebirrForm = useForm({
        resolver: zodResolver(telebirrSchema),
        defaultValues: { phone: '' },
    });

    // We no longer need a react-hook-form for stripe as it's a redirect

    const showMpgsOption = USE_MPGS_CHECKOUT;
    const internationalCardCount = 1 + (showMpgsOption ? 1 : 0);

    /**
     * Local Ethiopian rails (CBE Birr, Zemen, Dashen, etc.) are only offered when ALL hold:
     *  - not globally disabled (NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED !== 'false'), AND
     *  - the booking itself is local (domestic ET flight / ET hotel) — `isLocal` from the page, AND
     *  - the visitor appears to be in Ethiopia (so a user in Kenya never sees CBE Birr), AND
     *  - at least one local channel is registered.
     * Otherwise the Local group is hidden and only the International card group shows.
     */
    const showLocalGroup =
        SHOW_LOCAL_PAYMENT_METHODS &&
        isLocal &&
        visitorIsEthiopian &&
        localChannels.length > 0;

    // Per-group responsive grids (each group lays out independently now).
    const localGridClass =
        localChannels.length >= 3
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : localChannels.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1';
    const intlGridClass =
        internationalCardCount > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';

    // Safety: if local rails become unavailable (e.g. visitor resolves to non-Ethiopian),
    // force the International group so the user never sits on a hidden option.
    useEffect(() => {
        if (!showLocalGroup) {
            setActiveGroup('international');
            if (method === 'cbebirr' || method === 'telebirr') {
                setMethod(defaultCardMethod());
                setPaymentChannel('stripe');
            }
        }
    }, [showLocalGroup, method]);

    // Server-verified ETB amount for local rails (replaces rough USD×55 estimate).
    useEffect(() => {
        if (!showLocalGroup || !auth?.currentUser) {
            setEtbQuoteAmount(null);
            return;
        }

        let cancelled = false;
        const loadQuote = async () => {
            setEtbQuoteLoading(true);
            const user = auth?.currentUser;
            if (!user) {
                setEtbQuoteLoading(false);
                return;
            }
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/payments/quote-etb', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        bookingType,
                        source,
                        externalItemId,
                        currency: 'ETB',
                        paymentChannel: 'cbe_birr',
                        external_snapshot: externalSnapshot,
                    }),
                });
                if (!response.ok || cancelled) return;
                const data = await response.json();
                if (!cancelled && typeof data.amount === 'number' && data.amount > 0) {
                    setEtbQuoteAmount(data.amount);
                }
            } catch {
                /* keep fallback display amount */
            } finally {
                if (!cancelled) setEtbQuoteLoading(false);
            }
        };

        void loadQuote();
        return () => {
            cancelled = true;
        };
    }, [showLocalGroup, bookingType, source, externalItemId, externalSnapshot]);

    // Poll payment status after CBE Birr USSD push until PAID / terminal failure.
    useEffect(() => {
        if (!awaitingBankPayment || !paymentReference || !auth?.currentUser) return;

        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 100;

        const tick = async () => {
            if (cancelled || attempts >= maxAttempts) return;
            attempts += 1;
            const user = auth?.currentUser;
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const result = await fetchPaymentStatus(paymentReference, token);
                if ('error' in result) return;

                if (result.status === 'PAID' || result.status === 'CONFIRMED') {
                    cancelled = true;
                    toast.success(t('bookingUi.toastPaymentDone'));
                    onSuccess('cbebirr');
                    return;
                }
                if (result.status === 'EXPIRED' || result.status === 'FAILED') {
                    cancelled = true;
                    setAwaitingBankPayment(false);
                    toast.error(t('bookingUi.payment.cbeBirrPaymentFailed'));
                }
            } catch {
                /* retry on next interval */
            }
        };

        const intervalId = window.setInterval(() => void tick(), 3000);
        void tick();

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [awaitingBankPayment, paymentReference, onSuccess, t]);

    const ensureCheckoutPrerequisites = async (): Promise<string | null> => {
        if (!auth?.currentUser) {
            toast.error(t('bookingUi.payment.toastSignIn'));
            return null;
        }

        if (
            (bookingType === 'flight' || bookingType === 'hotel') &&
            (!externalItemId || externalItemId === 'N/A')
        ) {
            toast.error(
                bookingType === 'flight'
                    ? t('bookingUi.payment.toastNeedFlight')
                    : t('bookingUi.payment.toastNeedHotel'),
            );
            return null;
        }

        return auth.currentUser.getIdToken(true);
    };

    const handlePayment = async (data: any) => {
        setLoading(true);

        if (method === 'pay_on_site') {
            setLoading(false);
            toast.success(t('bookingUi.payment.toastReserveOnSite'));
            onSuccess(method);
            return;
        }

        const isBankRail =
            method === 'cbebirr' ||
            (SHOW_LOCAL_PAYMENT_METHODS && isLocalPaymentChannel(paymentChannel));

        if (method === 'mpgs') {
            setPaymentReference(null);
            setUssdInstructions(null);
            setAwaitingBankPayment(false);
            let navigatingAway = false;
            try {
                const token = await ensureCheckoutPrerequisites();
                if (!token) return;

                void resolveCheckoutReturnUrlForRequest();

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        bookingType,
                        source,
                        externalItemId,
                        currency: currencyCode || 'USD',
                        paymentChannel: 'mpgs',
                        external_snapshot: externalSnapshot,
                    }),
                });

                if (response.status === 401) {
                    toast.error(t('bookingUi.payment.toastAuthFailed'));
                }

                const payload = await response.json();
                const {
                    error,
                    sessionId,
                    paymentReference: payRef,
                    payNar,
                    checkoutScriptUrl,
                } = payload || {};
                const resolvedRef =
                    typeof payRef === 'string'
                        ? payRef
                        : typeof payNar === 'string'
                          ? payNar
                          : null;

                if (resolvedRef) {
                    setPaymentReference(resolvedRef);
                    try {
                        sessionStorage.setItem('last_pay_nar', resolvedRef);
                    } catch {
                        /* ignore */
                    }
                }

                if (
                    typeof sessionId === 'string' &&
                    isValidMpgsSessionId(sessionId)
                ) {
                    const trustedScriptUrl = resolveTrustedMpgsCheckoutScriptUrl(
                        typeof checkoutScriptUrl === 'string' ? checkoutScriptUrl : undefined,
                    );
                    if (!trustedScriptUrl) {
                        toast.error(t('bookingUi.payment.toastMpgsInit'));
                        return;
                    }
                    const ref = resolvedRef ?? '';
                    const params = new URLSearchParams({
                        session: sessionId.trim(),
                        ...(ref ? { ref } : {}),
                    });
                    navigatingAway = true;
                    window.location.replace(`/booking/mpgs-checkout?${params.toString()}`);
                    return;
                }

                toast.error(error || t('bookingUi.payment.toastMpgsInit'));
            } catch (err) {
                toast.error(t('bookingUi.payment.toastMpgsInit'));
                console.error(err);
            } finally {
                if (!navigatingAway) setLoading(false);
            }
            return;
        }

        if (method === 'stripe') {
            setPaymentReference(null);
            setUssdInstructions(null);
            setAwaitingBankPayment(false);
            try {
                const token = await ensureCheckoutPrerequisites();
                if (!token) return;

                void resolveCheckoutReturnUrlForRequest();

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        bookingType,
                        source,
                        externalItemId,
                        currency: currencyCode || 'USD',
                        paymentChannel: 'stripe',
                        external_snapshot: externalSnapshot,
                    }),
                });

                if (response.status === 401) {
                    toast.error(t('bookingUi.payment.toastAuthFailed'));
                }

                const payload = await response.json();
                const { url, error, sessionId, paymentReference: payRef, payNar } = payload || {};
                const resolvedRef =
                    typeof payRef === 'string'
                        ? payRef
                        : typeof payNar === 'string'
                          ? payNar
                          : null;

                if (resolvedRef) {
                    setPaymentReference(resolvedRef);
                    try {
                        sessionStorage.setItem('last_pay_nar', resolvedRef);
                    } catch {
                        /* ignore */
                    }
                }

                if (url) {
                    window.location.href = url;
                    return;
                }

                if (sessionId) {
                    const stripe = await getStripe();
                    if (!stripe) {
                        toast.error(t('bookingUi.payment.toastStripeLoad'));
                    } else {
                        const { error: stripeError } = await (stripe as any).redirectToCheckout({ sessionId });
                        if (stripeError) {
                            console.error('Stripe redirect error:', stripeError);
                            toast.error(stripeError.message || t('bookingUi.payment.toastStripeRedirect'));
                        }
                    }
                    return;
                }

                toast.error(error || t('bookingUi.payment.toastStripeInit'));
            } catch (err) {
                toast.error(t('bookingUi.payment.toastStripeInit'));
                console.error(err);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (isBankRail) {
            setPaymentReference(null);
            setUssdInstructions(null);
            setAwaitingBankPayment(false);

            const msisdnForApi =
                paymentChannel === 'cbe_birr' ? localPhone.trim() : localPhone.trim() || customerPhone;
            if (paymentChannel === 'cbe_birr' && !ET_MOBILE_PATTERN.test(localPhone)) {
                setLocalPhoneError(t('bookingUi.payment.validationCbePhone'));
                setLoading(false);
                return;
            }

            try {
                const token = await ensureCheckoutPrerequisites();
                if (!token) return;

                void resolveCheckoutReturnUrlForRequest();

                const checkoutBody: Record<string, unknown> = {
                    bookingType,
                    source,
                    externalItemId,
                    currency: 'ETB',
                    paymentChannel,
                    external_snapshot: externalSnapshot,
                };
                if (msisdnForApi) {
                    checkoutBody.metadata = buildLocalCheckoutMetadata({
                        customerMsisdn: msisdnForApi,
                        externalSnapshot,
                    });
                }

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(checkoutBody),
                });

                if (response.status === 401) {
                    toast.error(t('bookingUi.payment.toastAuthFailed'));
                    return;
                }

                const payload = await response.json();
                const {
                    url,
                    error,
                    message,
                    paymentReference: payRef,
                    payNar,
                    paymentUrl,
                    ussdInstructions: ussd,
                    awaitingBankPayment: awaitingUssd,
                } = payload || {};
                const resolvedRef =
                    typeof payRef === 'string'
                        ? payRef
                        : typeof payNar === 'string'
                          ? payNar
                          : null;

                if (!response.ok) {
                    toast.error(message || error || t('bookingUi.payment.cbeBirrInitFailed'));
                    return;
                }

                if (resolvedRef) {
                    setPaymentReference(resolvedRef);
                    try {
                        sessionStorage.setItem('last_pay_nar', resolvedRef);
                    } catch {
                        /* ignore */
                    }
                }

                if (typeof ussd === 'string') {
                    setUssdInstructions(ussd);
                }

                // CBE Birr USSD: stay on page and poll — do not redirect to success URL yet.
                if (paymentChannel === 'cbe_birr' && (awaitingUssd || ussd)) {
                    setAwaitingBankPayment(true);
                    return;
                }

                const redirectUrl = paymentUrl || url;
                if (redirectUrl) {
                    setAwaitingBankPayment(true);
                    window.location.href = redirectUrl;
                    return;
                }

                if (error) {
                    toast.error(error);
                }
            } catch (err) {
                toast.error(t('bookingUi.payment.cbeBirrInitFailed'));
                console.error(err);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Local payment processing (simulated)
        setTimeout(() => {
            setLoading(false);
            onSuccess(method);
        }, 2000);
    };

    const onSubmit = (data: any) => {
        handlePayment(data);
    };

    // Validate the Ethiopian mobile number, then kick off the CBE Birr USSD push.
    const submitLocalBank = () => {
        if (!ET_MOBILE_PATTERN.test(localPhone)) {
            setLocalPhoneError(t('bookingUi.payment.validationCbePhone'));
            return;
        }
        setLocalPhoneError(null);
        void handlePayment({});
    };

    const localUssdSent = Boolean(ussdInstructions) || awaitingBankPayment;

    return (
        <div className="space-y-8 overflow-x-hidden">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-brand-dark dark:text-foreground">{t('bookingUi.payment.chooseMethod')}</h3>
                <p className="text-gray-600 dark:text-slate-300 text-base">
                    {t('bookingUi.payment.totalAmount')}{' '}
                    <span className="text-brand-primary font-bold text-2xl">
                        {formatCurrency(displayAmount, currency)}
                    </span>
                </p>
            </div>

            <div className="space-y-6 md:space-y-8">
                {showLocalGroup && (
                    <div className="mx-auto flex w-full max-w-sm items-center rounded-full border bg-muted/40 p-1 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => selectGroup('local')}
                            aria-pressed={activeGroup === 'local'}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                                activeGroup === 'local'
                                    ? 'bg-white text-[#006838] shadow-sm dark:bg-slate-800'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-slate-400',
                            )}
                        >
                            <Landmark className="h-4 w-4" />
                            {t('bookingUi.payment.localTitle')}
                        </button>
                        <button
                            type="button"
                            onClick={() => selectGroup('international')}
                            aria-pressed={activeGroup === 'international'}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                                activeGroup === 'international'
                                    ? 'bg-white text-[#635BFF] shadow-sm dark:bg-slate-800'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-slate-400',
                            )}
                        >
                            <Globe2 className="h-4 w-4" />
                            {t('bookingUi.payment.internationalTitle')}
                        </button>
                    </div>
                )}

                {showLocalGroup && activeGroup === 'local' && (
                    <PaymentSection
                        icon={<Landmark className="w-4 h-4" />}
                        title={t('bookingUi.payment.localTitle')}
                        hint={t('bookingUi.payment.localBanksTitle')}
                    >
                        <div className={`grid gap-4 md:gap-6 ${localGridClass}`}>
                            {localChannels.map((ch) => (
                                <button
                                    key={ch.id}
                                    type="button"
                                    onClick={() => {
                                        selectMethod('cbebirr');
                                        setPaymentChannel(ch.id);
                                    }}
                                    className={`p-4 md:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 min-h-[120px] md:min-h-[140px] ${
                                        method === 'cbebirr' && paymentChannel === ch.id
                                            ? 'border-[#006838] bg-[#006838]/10 shadow-lg ring-2 ring-[#006838]/20'
                                            : 'border-gray-200 dark:border-slate-600 hover:border-[#006838]/40 hover:shadow-md bg-white dark:bg-slate-800/80'
                                    }`}
                                >
                                    <div className="w-12 h-12 md:w-16 md:h-16 relative">
                                        {ch.logo ? (
                                            <Image
                                                src={ch.logo}
                                                alt={t(ch.labelKey)}
                                                fill
                                                className="object-contain"
                                            />
                                        ) : (
                                            <Building2 className="w-10 h-10 text-[#006838]" />
                                        )}
                                    </div>
                                    <span className="text-sm uppercase tracking-wide font-bold text-center text-gray-700">
                                        {t(ch.labelKey)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </PaymentSection>
                )}

                {activeGroup === 'international' && (
                <PaymentSection
                    icon={<Globe2 className="w-4 h-4" />}
                    title={t('bookingUi.payment.internationalTitle')}
                >
                    <div className={`grid gap-4 md:gap-6 ${intlGridClass}`}>
                        <button
                            type="button"
                            onClick={() => selectMethod('stripe')}
                            className={`p-4 md:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 min-h-[120px] md:min-h-[160px] ${method === 'stripe'
                                ? 'border-[#635BFF] bg-[#635BFF]/10 shadow-lg ring-2 ring-[#635BFF]/20'
                                : 'border-gray-200 dark:border-slate-600 hover:border-[#635BFF]/40 hover:shadow-md bg-white dark:bg-slate-800/80'
                                }`}
                        >
                            <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden relative bg-white ring-1 ring-gray-100 ${method === 'stripe' ? 'scale-110 shadow-lg' : 'opacity-80'}`}>
                                <Image
                                    src="/assets/images/stripe.png"
                                    alt="Stripe"
                                    fill
                                    className="object-contain p-1.5 md:p-2.5"
                                />
                            </div>
                            <div className="text-center">
                                <span className={`block text-sm uppercase tracking-wide font-bold transition-colors ${method === 'stripe' ? 'text-[#635BFF]' : 'text-gray-600'}`}>{t('bookingUi.payment.stripeCard')}</span>
                            </div>
                        </button>

                        {showMpgsOption && (
                            <button
                                type="button"
                                onClick={() => selectMethod('mpgs')}
                                className={`p-4 md:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 min-h-[120px] md:min-h-[160px] ${
                                    method === 'mpgs'
                                        ? 'border-[#EB001B] bg-[#EB001B]/10 shadow-lg ring-2 ring-[#EB001B]/20'
                                        : 'border-gray-200 dark:border-slate-600 hover:border-[#EB001B]/40 hover:shadow-md bg-white dark:bg-slate-800/80'
                                }`}
                            >
                                <div
                                    className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden relative bg-white ring-1 ring-gray-100 ${
                                        method === 'mpgs' ? 'scale-110 shadow-lg' : 'opacity-80'
                                    }`}
                                >
                                    <Image
                                        src="/assets/images/masterCard.png"
                                        alt="Mastercard"
                                        fill
                                        className="object-contain p-2 md:p-3"
                                    />
                                </div>
                                <div className="text-center">
                                    <span
                                        className={`block text-sm uppercase tracking-wide font-bold transition-colors ${
                                            method === 'mpgs' ? 'text-[#EB001B]' : 'text-gray-600'
                                        }`}
                                    >
                                        {t('bookingUi.payment.mpgsCards')}
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                </PaymentSection>
                )}
            </div>

            <div className="space-y-4">
                {showLocalGroup && activeGroup === 'local' && method === 'cbebirr' && activeLocalChannel && (
                    <LocalBankCheckout
                        accent={activeLocalChannel.accentColor ?? '#006838'}
                        logo={activeLocalChannel.logo}
                        bankName={t(activeLocalChannel.labelKey)}
                        title={t('bookingUi.payment.cbeBirrCheckoutTitle')}
                        hint={t('bookingUi.payment.cbeBirrCheckoutHint')}
                        phoneLabel={t('bookingUi.payment.cbeBirrPhoneLabel')}
                        phonePlaceholder={t('bookingUi.payment.cbeBirrPhonePlaceholder')}
                        phoneHint={t('bookingUi.payment.cbeBirrPhoneHint')}
                        phone={localPhone}
                        onPhone={(v) => {
                            setLocalPhone(v);
                            if (localPhoneError) setLocalPhoneError(null);
                        }}
                        error={localPhoneError}
                        loading={loading}
                        payLabel={t('bookingUi.payment.cbeBirrSendUssd', {
                            amount: formatCurrency(displayAmount, 'ETB'),
                        })}
                        cancelLabel={t('bookingUi.payment.cancel')}
                        onPay={submitLocalBank}
                        onCancel={onCancel}
                        ussdSent={localUssdSent}
                        ussdInstructions={ussdInstructions}
                        ussdSentTitle={t('bookingUi.payment.cbeBirrUssdSentTitle')}
                        ussdSentHint={t('bookingUi.payment.cbeBirrUssdSentHint', {
                            phone: localPhone,
                        })}
                        awaitingLabel={t('bookingUi.payment.cbeBirrAwaiting')}
                        referenceLabel={t('bookingUi.payment.paymentReferenceLabel')}
                        paymentReference={paymentReference}
                        onChangeMethod={() => {
                            setUssdInstructions(null);
                            setAwaitingBankPayment(false);
                        }}
                    />
                )}

                {method === 'stripe' && (
                    <div className="space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <div className="bg-teal-50 p-4 rounded-xl text-sm text-teal-700 border border-teal-100 flex items-center gap-3">
                                <CreditCard className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="font-bold">{t('bookingUi.payment.secureStripeTitle')}</p>
                                    <p className="text-xs opacity-80">{t('bookingUi.payment.secureStripeHint')}</p>
                                </div>
                            </div>
                            {(loading || paymentReference) && (
                                <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-900 border border-amber-100">
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                        {t('bookingUi.payment.paymentReferenceLabel')}
                                    </p>
                                    <p className="mt-1 font-mono text-base font-bold tracking-wide">
                                        {paymentReference || t('bookingUi.payment.paymentReferencePending')}
                                    </p>
                                    <p className="mt-2 text-xs text-amber-800/80">
                                        {t('bookingUi.payment.paymentReferenceHint')}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={onCancel} className="flex-1" type="button">
                                {t('bookingUi.payment.cancel')}
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={loading}
                                onClick={() => handlePayment({})}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    t('bookingUi.payment.pay', { amount: formatCurrency(displayAmount, currency) })
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {method === 'mpgs' && (
                    <div className="space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <div className="bg-orange-50 p-4 rounded-xl text-sm text-orange-900 border border-orange-100 flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="font-bold">{t('bookingUi.payment.secureMpgsTitle')}</p>
                                    <p className="text-xs opacity-80">{t('bookingUi.payment.secureMpgsHint')}</p>
                                </div>
                            </div>
                        </motion.div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={onCancel} className="flex-1" type="button">
                                {t('bookingUi.payment.cancel')}
                            </Button>
                            <Button
                                className="flex-1 bg-[#EB001B] hover:bg-[#c40018] text-white"
                                disabled={loading}
                                onClick={() => handlePayment({})}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    t('bookingUi.payment.pay', { amount: formatCurrency(displayAmount, currency) })
                                )}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

/**
 * Section wrapper that groups payment methods under a labelled header
 * (e.g. "Local" vs "International"). Uses the existing neutral palette only —
 * the colourful accents stay on the method cards themselves.
 */
const PaymentSection: React.FC<{
    icon: React.ReactNode;
    title: string;
    hint?: string;
    children: React.ReactNode;
}> = ({ icon, title, hint, children }) => (
    <section>
        <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                {icon}
            </span>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200">
                {title}
            </h4>
            {hint && (
                <span className="hidden text-xs text-gray-400 dark:text-slate-400 sm:inline">
                    · {hint}
                </span>
            )}
        </div>
        {children}
    </section>
);

/**
 * CBE Birr (and any future Ethiopian bank) mobile-money checkout.
 * Collects an Ethiopian mobile number, fires the USSD push on "pay", then shows a
 * themed "approve on your phone" confirmation. Fully driven by the bank's `accent`
 * (hex) color via inline styles, so the same flow is reusable per bank — only the
 * color/logo/labels change.
 */
interface LocalBankCheckoutProps {
    accent: string;
    logo?: string;
    bankName: string;
    title: string;
    hint: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneHint: string;
    phone: string;
    onPhone: (value: string) => void;
    error: string | null;
    loading: boolean;
    payLabel: string;
    cancelLabel: string;
    onPay: () => void;
    onCancel: () => void;
    ussdSent: boolean;
    ussdInstructions: string | null;
    ussdSentTitle: string;
    ussdSentHint: string;
    awaitingLabel: string;
    referenceLabel: string;
    paymentReference: string | null;
    onChangeMethod: () => void;
}

const LocalBankCheckout: React.FC<LocalBankCheckoutProps> = ({
    accent,
    logo,
    bankName,
    title,
    hint,
    phoneLabel,
    phonePlaceholder,
    phoneHint,
    phone,
    onPhone,
    error,
    loading,
    payLabel,
    cancelLabel,
    onPay,
    onCancel,
    ussdSent,
    ussdInstructions,
    ussdSentTitle,
    ussdSentHint,
    awaitingLabel,
    referenceLabel,
    paymentReference,
    onChangeMethod,
}) => {
    // Accent-derived tints (8-digit hex = color + alpha).
    const tintWeak = `${accent}14`; // ~8%
    const tintSoft = `${accent}1f`; // ~12%
    const borderTint = `${accent}40`; // ~25%

    const BankLogo = ({ size }: { size: number }) =>
        logo ? (
            <Image src={logo} alt={bankName} width={size} height={size} className="h-full w-full object-cover" />
        ) : (
            <Building2 className="h-2/3 w-2/3" style={{ color: accent }} />
        );

    if (ussdSent) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm dark:bg-slate-800/80"
                style={{ borderColor: borderTint }}
            >
                <div className="flex items-center gap-3 p-5 text-white" style={{ backgroundColor: accent }}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-2 ring-white/30">
                        <BankLogo size={48} />
                    </div>
                    <div>
                        <p className="text-sm opacity-80">{bankName}</p>
                        <h4 className="text-lg font-semibold">{ussdSentTitle}</h4>
                    </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                    <div
                        className="flex items-start gap-3 rounded-xl border p-4 text-sm"
                        style={{ backgroundColor: tintWeak, borderColor: borderTint }}
                    >
                        <Smartphone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
                        <p className="text-gray-700 dark:text-slate-200">{ussdSentHint}</p>
                    </div>

                    {ussdInstructions && (
                        <div className="rounded-xl border-2 border-dashed bg-background p-3 text-center" style={{ borderColor: borderTint }}>
                            <p className="font-mono text-lg font-bold tracking-widest" style={{ color: accent }}>
                                {ussdInstructions}
                            </p>
                        </div>
                    )}

                    {paymentReference && (
                        <div className="rounded-xl bg-muted px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {referenceLabel}
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-semibold">{paymentReference}</p>
                        </div>
                    )}

                    <div
                        className="flex items-center justify-center gap-2 rounded-xl p-3 text-sm text-muted-foreground"
                        style={{ backgroundColor: tintWeak }}
                    >
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: accent }} />
                        {awaitingLabel}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" type="button" onClick={onChangeMethod}>
                            {cancelLabel}
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: borderTint, backgroundColor: tintWeak }}
        >
            <div
                className="flex items-center gap-3 border-b p-4"
                style={{ borderColor: borderTint, backgroundColor: tintSoft }}
            >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1" style={{ ['--tw-ring-color' as any]: borderTint }}>
                    <BankLogo size={44} />
                </div>
                <div>
                    <p className="font-semibold" style={{ color: accent }}>{title}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
            </div>

            <div className="space-y-4 p-5">
                <div>
                    <Label htmlFor="local-bank-phone" className="mb-1.5 block">
                        {phoneLabel}
                    </Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                        </span>
                        <Input
                            id="local-bank-phone"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder={phonePlaceholder}
                            value={phone}
                            maxLength={10}
                            onChange={(e) => onPhone(e.target.value.replace(/\D/g, ''))}
                            className="pl-9 tracking-wider"
                        />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{phoneHint}</p>
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 text-sm font-medium text-destructive"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                    <Button variant="outline" className="flex-1" type="button" onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        className="flex-1 text-white hover:brightness-95"
                        style={{ backgroundColor: accent }}
                        disabled={loading}
                        onClick={onPay}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : payLabel}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};
