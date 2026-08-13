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
    ET_MOBILE_PATTERN,
    fetchPaymentStatus,
} from '@/lib/local-payment-checkout';
import {
    etbToUsdDisplay,
    getPublicEtbPerUsd,
    usdToEtbDisplay,
} from '@/lib/etb-usd';
import type { PaymentSuccessResult } from '@/lib/payment-success';

const USE_MPGS_CHECKOUT = process.env.NEXT_PUBLIC_MPGS_ENABLED === 'true';

interface PaymentFormProps {
    amount: number;
    onSuccess: (result: PaymentSuccessResult) => void;
    onCancel: () => void;
    isLocal?: boolean; // New prop to determine if local methods (Telebirr/CBE) should be shown
    // Optional metadata for Stripe backend spec
    bookingType?: 'flight' | 'hotel' | 'event' | 'car' | 'shuttle' | 'conference';
    source?: string; // e.g., 'amadeus', 'duffel', 'local'
    externalItemId?: string; // ID from provider/search result
    currencyCode?: string; // default USD
    externalSnapshot?: Record<string, any>;
    /** E.164 or local ET number from booking form  pre-fills CBE Birr USSD phone. */
    customerPhone?: string;
    /** From hotel reserve summary  select pay now / mobile / pay at property */
    preferredPaymentTiming?: 'pay_now' | 'mobile_money' | 'pay_at_property';
}

type PaymentMethod = PaymentSuccessResult['method'];

const defaultCardMethod = (): PaymentMethod =>
    USE_MPGS_CHECKOUT ? 'mpgs' : 'stripe';

function nestMoney(
    payload: Record<string, unknown>,
    fallbackAmount: number,
    fallbackCurrency: 'ETB' | 'USD',
): Pick<PaymentSuccessResult, 'amount' | 'currency' | 'paymentReference' | 'bookingId'> {
    const amountRaw = payload?.amount;
    const amount =
        typeof amountRaw === 'number' && Number.isFinite(amountRaw) && amountRaw > 0
            ? amountRaw
            : fallbackAmount;
    const cur = String(payload?.currency || fallbackCurrency).toUpperCase();
    const currency: 'ETB' | 'USD' = cur === 'USD' ? 'USD' : 'ETB';
    const paymentReference =
        typeof payload?.paymentReference === 'string'
            ? payload.paymentReference
            : typeof payload?.payNar === 'string'
              ? payload.payNar
              : null;
    const bookingId =
        typeof payload?.bookingId === 'string' ? payload.bookingId : null;
    return { amount, currency, paymentReference, bookingId };
}

// Local Ethiopian rails are available by default; set NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED=false to hide globally.
const SHOW_LOCAL_PAYMENT_METHODS =
    process.env.NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED !== 'false';

/** USSD wait: poll every 3s, stop after ~3 min and close for security. */
const CBE_BIRR_POLL_INTERVAL_MS = 3000;
const CBE_BIRR_POLL_MAX_ATTEMPTS = 60;

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
    preferredPaymentTiming,
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
    const initialFromTiming = (): {
        method: PaymentMethod;
        channel: PaymentChannelId;
        group: 'local' | 'international';
    } => {
        if (
            preferredPaymentTiming === 'pay_at_property' &&
            (bookingType === 'hotel' ||
                bookingType === 'shuttle' ||
                bookingType === 'conference')
        ) {
            return { method: 'pay_on_site', channel: 'stripe', group: 'international' };
        }
        if (preferredPaymentTiming === 'mobile_money' && SHOW_LOCAL_PAYMENT_METHODS) {
            return { method: 'cbebirr', channel: 'cbe_birr', group: 'local' };
        }
        if (SHOW_LOCAL_PAYMENT_METHODS && isLocal) {
            return { method: 'cbebirr', channel: 'cbe_birr', group: 'local' };
        }
        return {
            method: defaultCardMethod(),
            channel: 'stripe',
            group: 'international',
        };
    };
    const seeded = initialFromTiming();
    const [method, setMethod] = useState<PaymentMethod>(seeded.method);
    const [paymentChannel, setPaymentChannel] = useState<PaymentChannelId>(
        seeded.channel,
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
    // Which group is currently shown. Local and International are mutually exclusive in the UI:
    // selecting one hides the other (cleaner, less cluttered checkout).
    const [activeGroup, setActiveGroup] = useState<'local' | 'international'>(
        seeded.group,
    );

    // The currently selected local bank config (drives logo + accent color for its checkout panel).
    const activeLocalChannel = useMemo(
        () => localChannels.find((c) => c.id === paymentChannel) ?? localChannels[0],
        [localChannels, paymentChannel],
    );

    // Prefer Local tab for Ethiopian visitors when timing is “pay now” and local rails exist.
    useEffect(() => {
        if (preferredPaymentTiming === 'mobile_money') return;
        if (preferredPaymentTiming === 'pay_at_property') return;
        if (!SHOW_LOCAL_PAYMENT_METHODS || !isLocal) return;
        if (detectEthiopianVisitor(locale)) {
            setActiveGroup('local');
            setMethod('cbebirr');
            setPaymentChannel('cbe_birr');
        }
    }, [locale, isLocal, preferredPaymentTiming]);

    const selectMethod = useCallback((next: PaymentMethod) => {
        setMethod(next);
        setPaymentReference(null);
        setUssdInstructions(null);
        setLocalPhoneError(null);
        setAwaitingBankPayment(false);
    }, []);

    /** End CBE Birr USSD wait  stop polling and clear sensitive checkout state. */
    const resetCbeBirrUssdSession = useCallback(() => {
        setAwaitingBankPayment(false);
        setUssdInstructions(null);
        setPaymentReference(null);
        setLoading(false);
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

    const isCardMethod = method === 'stripe' || method === 'mpgs';
    // Stripe / Mastercard do not settle ETB  always charge & show USD for card rails.
    const currency =
        method === 'telebirr' || method === 'cbebirr'
            ? 'ETB'
            : isCardMethod
              ? 'USD'
              : currencyCode || 'USD';
    const listingIsEtb = String(currencyCode || '').toUpperCase() === 'ETB';
    // Never use the old ×55 hack. ETB listings stay as-is; USD listings use public FX until quote returns.
    const localFallbackEtb = listingIsEtb
        ? amount
        : usdToEtbDisplay(amount, getPublicEtbPerUsd());
    const cardUsdAmount = listingIsEtb ? etbToUsdDisplay(amount) : amount;
    const displayAmount =
        method === 'telebirr' || method === 'cbebirr'
            ? etbQuoteAmount ?? localFallbackEtb
            : isCardMethod
              ? cardUsdAmount
              : amount;

    const telebirrForm = useForm({
        resolver: zodResolver(telebirrSchema),
        defaultValues: { phone: '' },
    });

    // We no longer need a react-hook-form for stripe as it's a redirect

    const showMpgsOption = USE_MPGS_CHECKOUT;
    const internationalCardCount = 1 + (showMpgsOption ? 1 : 0);

    /**
     * Local Ethiopian rails (CBE Birr, etc.) when:
     *  - not globally disabled, AND
     *  - booking is local (ET hotel / domestic flight) OR guest chose “Mobile money”, AND
     *  - at least one local channel is registered.
     * Timezone is only used to default the Local vs International tab  not to hide CBE Birr
     * for Ethiopian hotel inventory (guests abroad still pay via a local MSISDN).
     */
    const showLocalGroup =
        SHOW_LOCAL_PAYMENT_METHODS &&
        (isLocal || preferredPaymentTiming === 'mobile_money') &&
        localChannels.length > 0;

    const intlMethodCount =
        internationalCardCount +
        (bookingType === 'hotel' ||
        bookingType === 'shuttle' ||
        bookingType === 'conference'
            ? 1
            : 0);
    const intlGridClass = intlMethodCount > 1 ? 'grid-cols-2' : 'grid-cols-1';

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

    // Server-verified ETB amount (live CBE remittance FX when listing is USD).
    useEffect(() => {
        if (!showLocalGroup) {
            setEtbQuoteAmount(null);
            return;
        }

        let cancelled = false;
        const loadQuote = async () => {
            setEtbQuoteLoading(true);
            try {
                const { ensureCheckoutIdToken } = await import(
                    '@/lib/guest-checkout-auth'
                );
                const guestEmail =
                    typeof externalSnapshot?.guestEmail === 'string'
                        ? externalSnapshot.guestEmail.trim()
                        : typeof externalSnapshot?.email === 'string'
                          ? externalSnapshot.email.trim()
                          : '';
                const guestPhone =
                    typeof externalSnapshot?.guestPhone === 'string'
                        ? externalSnapshot.guestPhone.trim()
                        : typeof externalSnapshot?.phone === 'string'
                          ? externalSnapshot.phone.trim()
                          : customerPhone.trim();
                const guestName =
                    typeof externalSnapshot?.guestName === 'string'
                        ? externalSnapshot.guestName.trim()
                        : typeof externalSnapshot?.customerName === 'string'
                          ? externalSnapshot.customerName.trim()
                          : '';

                const token =
                    (await auth?.currentUser?.getIdToken()) ||
                    (await ensureCheckoutIdToken({
                        email: guestEmail,
                        phone: guestPhone,
                        name: guestName || undefined,
                    }).catch(() => null));

                if (!token || cancelled) {
                    setEtbQuoteLoading(false);
                    return;
                }

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
                        currency: listingIsEtb ? 'ETB' : currencyCode || 'USD',
                        paymentChannel: 'cbe_birr',
                        external_snapshot: externalSnapshot,
                    }),
                });
                if (!response.ok || cancelled) return;
                const data = await response.json();
                if (!cancelled && typeof data.amount === 'number' && data.amount > 0) {
                    setEtbQuoteAmount(data.amount);
                    if (
                        typeof data.fxEtbPerUsd === 'number' &&
                        data.fxEtbPerUsd > 0
                    ) {
                        try {
                            sessionStorage.setItem(
                                'bookaddis_fx_etb_per_usd',
                                String(data.fxEtbPerUsd),
                            );
                        } catch {
                            /* ignore */
                        }
                    }
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
    }, [
        showLocalGroup,
        bookingType,
        source,
        externalItemId,
        externalSnapshot,
        customerPhone,
        listingIsEtb,
        currencyCode,
    ]);

    // Poll payment status after CBE Birr USSD push until PAID, failure, or timeout.
    useEffect(() => {
        if (!awaitingBankPayment || !paymentReference || !auth?.currentUser) return;
        if (paymentChannel !== 'cbe_birr') return;

        let cancelled = false;
        let attempts = 0;

        const terminate = (
            messageKey: 'cbeBirrPaymentFailed' | 'cbeBirrSessionExpired',
            detail?: string,
        ) => {
            if (cancelled) return;
            cancelled = true;
            resetCbeBirrUssdSession();
            toast.error(detail || t(`bookingUi.payment.${messageKey}`));
            onCancel();
        };

        const tick = async () => {
            if (cancelled) return;
            if (attempts >= CBE_BIRR_POLL_MAX_ATTEMPTS) {
                terminate('cbeBirrSessionExpired');
                return;
            }
            attempts += 1;
            const user = auth?.currentUser;
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const result = await fetchPaymentStatus(paymentReference, token);
                if ('error' in result) return;

                if (result.status === 'PAID' || result.status === 'CONFIRMED') {
                    cancelled = true;
                    resetCbeBirrUssdSession();
                    toast.success(t('bookingUi.toastPaymentDone'));
                    const statusAmount =
                        typeof result.amount === 'number' && result.amount > 0
                            ? result.amount
                            : displayAmount;
                    const statusCurrency =
                        String(result.currency || 'ETB').toUpperCase() === 'USD'
                            ? 'USD'
                            : 'ETB';
                    onSuccess({
                        method: 'cbebirr',
                        amount: statusAmount,
                        currency: statusCurrency,
                        paymentReference:
                            result.paymentReference || paymentReference,
                        bookingId: result.bookingId,
                    });
                    return;
                }
                if (result.status === 'EXPIRED') {
                    terminate('cbeBirrSessionExpired');
                    return;
                }
                if (result.status === 'FAILED') {
                    terminate('cbeBirrPaymentFailed', result.failureReason);
                }
            } catch {
                /* retry on next interval */
            }
        };

        const intervalId = window.setInterval(() => void tick(), CBE_BIRR_POLL_INTERVAL_MS);
        void tick();

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [
        awaitingBankPayment,
        paymentReference,
        paymentChannel,
        onSuccess,
        onCancel,
        resetCbeBirrUssdSession,
        t,
    ]);

    const ensureCheckoutPrerequisites = async (): Promise<string | null> => {
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

        const guestEmail =
            typeof externalSnapshot?.guestEmail === 'string'
                ? externalSnapshot.guestEmail.trim()
                : typeof externalSnapshot?.email === 'string'
                  ? externalSnapshot.email.trim()
                  : '';
        const guestPhone =
            typeof externalSnapshot?.guestPhone === 'string'
                ? externalSnapshot.guestPhone.trim()
                : typeof externalSnapshot?.phone === 'string'
                  ? externalSnapshot.phone.trim()
                  : customerPhone.trim();
        if (!guestEmail.includes('@')) {
            toast.error('A valid email is required for booking confirmation');
            return null;
        }
        if (guestPhone.replace(/\D/g, '').length < 8) {
            toast.error('A valid phone number is required for booking confirmation');
            return null;
        }

        const guestName =
            typeof externalSnapshot?.guestName === 'string'
                ? externalSnapshot.guestName.trim()
                : typeof externalSnapshot?.customerName === 'string'
                  ? externalSnapshot.customerName.trim()
                  : '';

        try {
            const { ensureCheckoutIdToken } = await import('@/lib/guest-checkout-auth');
            const contact = {
                email: guestEmail,
                phone: guestPhone,
                name: guestName || undefined,
            };
            const { storeCheckoutGuestContact } = await import(
                '@/lib/checkout-guest-session'
            );
            storeCheckoutGuestContact(contact);
            return await ensureCheckoutIdToken(contact);
        } catch (e) {
            console.error('[payment] checkout auth failed', e);
            toast.error(
                e instanceof Error
                    ? e.message
                    : t('bookingUi.payment.toastSignIn'),
            );
            return null;
        }
    };

    const handlePayment = async (data: any) => {
        setLoading(true);

        if (method === 'pay_on_site') {
            try {
                const token = await ensureCheckoutPrerequisites();
                if (!token) return;

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
                        currency: currencyCode || 'ETB',
                        paymentChannel: 'pay_at_property',
                        external_snapshot: {
                            ...externalSnapshot,
                            payment_timing: 'PAY_AT_PROPERTY',
                        },
                    }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    toast.error(
                        payload?.error ||
                            payload?.message ||
                            t('bookingUi.payment.toastReserveOnSite'),
                    );
                    return;
                }
                const ref =
                    typeof payload?.paymentReference === 'string'
                        ? payload.paymentReference
                        : typeof payload?.payNar === 'string'
                          ? payload.payNar
                          : null;
                if (ref) {
                    try {
                        sessionStorage.setItem('last_pay_nar', ref);
                    } catch {
                        /* ignore */
                    }
                    setPaymentReference(ref);
                }
            toast.success(t('bookingUi.payment.toastReserveOnSite'));
                const money = nestMoney(
                    payload,
                    listingIsEtb ? amount : displayAmount,
                    'ETB',
                );
                onSuccess({ method, ...money });
            } catch (e) {
                toast.error((e as Error).message || 'Could not reserve stay');
            } finally {
                setLoading(false);
            }
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
                        currency: 'USD',
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
                        currency: 'USD',
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

                // CBE Birr USSD: no redirect  show phone prompt confirmation and poll until PIN/timeout.
                if (paymentChannel === 'cbe_birr') {
                    if (resolvedRef) {
                        setAwaitingBankPayment(true);
                        return;
                    }
                    toast.error(t('bookingUi.payment.cbeBirrInitFailed'));
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
            onSuccess({
                method,
                amount: displayAmount,
                currency: currency === 'USD' ? 'USD' : 'ETB',
                paymentReference,
            });
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

    const methodCardClass = (selected: boolean, accent: string) =>
        cn(
            'flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-all sm:min-h-[112px] sm:p-4',
            selected
                ? 'shadow-md ring-2'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800/80',
        );

    const allowsPayAtProperty =
        bookingType === 'hotel' ||
        bookingType === 'shuttle' ||
        bookingType === 'conference';
    const localMethodCount =
        localChannels.length + (allowsPayAtProperty ? 1 : 0);
    const localMethodsGrid =
        localMethodCount >= 2 ? 'grid-cols-2' : 'grid-cols-1';

    return (
        <div className="space-y-4 overflow-x-hidden">
            <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-brand-dark dark:text-foreground sm:text-xl">
                    {t('bookingUi.payment.chooseMethod')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                    {t('bookingUi.payment.totalAmount')}{' '}
                    <span className="text-xl font-bold text-brand-primary sm:text-2xl">
                        {formatCurrency(displayAmount, currency)}
                    </span>
                </p>
                {isCardMethod && listingIsEtb ? (
                    <p className="mx-auto max-w-sm text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                        Charged in USD (CBE rate ≈ {getPublicEtbPerUsd()} ETB = 1 USD).
                        Listing {formatCurrency(amount, 'ETB')}.
                    </p>
                ) : null}
                {(method === 'cbebirr' || method === 'telebirr') && etbQuoteLoading ? (
                    <p className="text-[11px] text-slate-500">Updating ETB amount with CBE rate…</p>
                ) : null}
                {(method === 'cbebirr' || method === 'telebirr') &&
                !listingIsEtb &&
                etbQuoteAmount != null ? (
                    <p className="mx-auto max-w-sm text-[11px] leading-snug text-slate-500">
                        Converted from {formatCurrency(amount, 'USD')} at today’s CBE remittance
                        rate.
                    </p>
                ) : null}
            </div>

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

            {/* Method cards  same layout for Local and International */}
            {showLocalGroup && activeGroup === 'local' ? (
                <div className={cn('grid gap-3', localMethodsGrid)}>
                    {localChannels.map((ch) => {
                        const selected =
                            method === 'cbebirr' && paymentChannel === ch.id;
                        return (
                                <button
                                    key={ch.id}
                                    type="button"
                                    onClick={() => {
                                        selectMethod('cbebirr');
                                        setPaymentChannel(ch.id);
                                    setLocalPhone('');
                                    setLocalPhoneError(null);
                                }}
                                className={methodCardClass(selected, '#006838')}
                                style={
                                    selected
                                        ? {
                                              borderColor: '#006838',
                                              backgroundColor: 'rgba(0,104,56,0.08)',
                                              ['--tw-ring-color' as string]:
                                                  'rgba(0,104,56,0.25)',
                                          }
                                        : undefined
                                }
                            >
                                <div
                                    className={cn(
                                        'relative h-12 w-12 overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 sm:h-14 sm:w-14',
                                        selected ? 'shadow-md' : 'opacity-90',
                                    )}
                                >
                                        {ch.logo ? (
                                            <Image
                                                src={ch.logo}
                                                alt={t(ch.labelKey)}
                                                fill
                                            className="object-contain p-1.5"
                                            />
                                        ) : (
                                        <Building2 className="m-auto h-8 w-8 text-[#006838]" />
                                        )}
                                    </div>
                                <span
                                    className={cn(
                                        'block text-center text-xs font-bold uppercase tracking-wide sm:text-sm',
                                        selected ? 'text-[#006838]' : 'text-gray-600',
                                    )}
                                >
                                        {t(ch.labelKey)}
                                    </span>
                                </button>
                        );
                    })}
                    {allowsPayAtProperty && (
                        <button
                            type="button"
                            onClick={() => selectMethod('pay_on_site')}
                            className={methodCardClass(
                                method === 'pay_on_site',
                                'var(--brand-primary, #0d9488)',
                            )}
                            style={
                                method === 'pay_on_site'
                                    ? {
                                          borderColor: 'var(--brand-primary, #0d9488)',
                                          backgroundColor: 'rgba(13,148,136,0.08)',
                                          ['--tw-ring-color' as string]:
                                              'rgba(13,148,136,0.25)',
                                      }
                                    : undefined
                            }
                        >
                            <div
                                className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-xl bg-white ring-1 ring-gray-100 sm:h-14 sm:w-14',
                                    method === 'pay_on_site' ? 'shadow-md' : 'opacity-90',
                                )}
                            >
                                <Landmark className="h-7 w-7 text-brand-primary" />
                        </div>
                            <span
                                className={cn(
                                    'block text-center text-xs font-bold uppercase tracking-wide sm:text-sm',
                                    method === 'pay_on_site'
                                        ? 'text-brand-primary'
                                        : 'text-gray-600',
                                )}
                            >
                                {t('bookingUi.payment.payOnSite')}
                            </span>
                        </button>
                    )}
                </div>
            ) : (
                <div className={cn('grid gap-3', intlGridClass)}>
                        <button
                            type="button"
                            onClick={() => selectMethod('stripe')}
                        className={methodCardClass(method === 'stripe', '#635BFF')}
                        style={
                            method === 'stripe'
                                ? {
                                      borderColor: '#635BFF',
                                      backgroundColor: 'rgba(99,91,255,0.08)',
                                      ['--tw-ring-color' as string]:
                                          'rgba(99,91,255,0.25)',
                                  }
                                : undefined
                        }
                    >
                        <div
                            className={cn(
                                'relative h-12 w-12 overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 sm:h-14 sm:w-14',
                                method === 'stripe' ? 'shadow-md' : 'opacity-90',
                            )}
                        >
                                <Image
                                    src="/assets/images/stripe.png"
                                    alt="Stripe"
                                    fill
                                className="object-contain p-1.5"
                                />
                            </div>
                        <span
                            className={cn(
                                'block text-center text-xs font-bold uppercase tracking-wide sm:text-sm',
                                method === 'stripe' ? 'text-[#635BFF]' : 'text-gray-600',
                            )}
                        >
                            {t('bookingUi.payment.stripeCard')}
                        </span>
                        </button>

                        {showMpgsOption && (
                            <button
                                type="button"
                                onClick={() => selectMethod('mpgs')}
                            className={methodCardClass(method === 'mpgs', '#EB001B')}
                            style={
                                    method === 'mpgs'
                                    ? {
                                          borderColor: '#EB001B',
                                          backgroundColor: 'rgba(235,0,27,0.08)',
                                          ['--tw-ring-color' as string]:
                                              'rgba(235,0,27,0.25)',
                                      }
                                    : undefined
                            }
                            >
                                <div
                                className={cn(
                                    'relative h-12 w-12 overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 sm:h-14 sm:w-14',
                                    method === 'mpgs' ? 'shadow-md' : 'opacity-90',
                                )}
                                >
                                    <Image
                                        src="/assets/images/masterCard.png"
                                        alt="Mastercard"
                                        fill
                                    className="object-contain p-2"
                                    />
                                </div>
                                    <span
                                className={cn(
                                    'block text-center text-xs font-bold uppercase tracking-wide sm:text-sm',
                                    method === 'mpgs' ? 'text-[#EB001B]' : 'text-gray-600',
                                )}
                                    >
                                        {t('bookingUi.payment.mpgsCards')}
                                    </span>
                            </button>
                        )}

                    {allowsPayAtProperty && (
                        <button
                            type="button"
                            onClick={() => selectMethod('pay_on_site')}
                            className={methodCardClass(method === 'pay_on_site', '#0d9488')}
                            style={
                                method === 'pay_on_site'
                                    ? {
                                          borderColor: 'var(--brand-primary, #0d9488)',
                                          backgroundColor: 'rgba(13,148,136,0.08)',
                                          ['--tw-ring-color' as string]:
                                              'rgba(13,148,136,0.25)',
                                      }
                                    : undefined
                            }
                        >
                            <div
                                className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-xl bg-white ring-1 ring-gray-100 sm:h-14 sm:w-14',
                                    method === 'pay_on_site' ? 'shadow-md' : 'opacity-90',
                                )}
                            >
                                <Landmark className="h-7 w-7 text-brand-primary" />
                    </div>
                            <span
                                className={cn(
                                    'block text-center text-xs font-bold uppercase tracking-wide sm:text-sm',
                                    method === 'pay_on_site'
                                        ? 'text-brand-primary'
                                        : 'text-gray-600',
                                )}
                            >
                                {t('bookingUi.payment.payOnSite')}
                            </span>
                        </button>
                )}
            </div>
            )}

            <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                {showLocalGroup &&
                    activeGroup === 'local' &&
                    method === 'cbebirr' &&
                    activeLocalChannel && (
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
                                resetCbeBirrUssdSession();
                            }}
                            onAbortUssd={() => {
                                resetCbeBirrUssdSession();
                                toast.message(t('bookingUi.payment.cbeBirrSessionClosed'));
                                onCancel();
                            }}
                            abortLabel={t('bookingUi.payment.cbeBirrCancelUssd')}
                        />
                    )}

                {method === 'pay_on_site' && (
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                            <div className="min-w-0">
                                <p className="font-bold">{t('bookingUi.payment.payOnSiteTitle')}</p>
                                <p className="text-xs leading-snug opacity-80">
                                    We&apos;ll hold your room and send a confirmation. Pay at the
                                    hotel on arrival  no online charge now.
                                </p>
                            </div>
                        </div>
                        {paymentReference ? (
                            <p className="font-mono text-sm font-bold">{paymentReference}</p>
                        ) : null}
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                className="h-11 sm:flex-1"
                                type="button"
                            >
                                {t('bookingUi.payment.cancel')}
                            </Button>
                            <Button
                                className="h-11 sm:flex-1"
                                disabled={loading}
                                onClick={() => void handlePayment({})}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Confirm reservation'
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {method === 'stripe' && (
                    <div className="space-y-3">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-700">
                                <CreditCard className="mt-0.5 h-5 w-5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold">{t('bookingUi.payment.secureStripeTitle')}</p>
                                    <p className="text-xs leading-snug opacity-80">
                                        {t('bookingUi.payment.secureStripeHint')}
                                    </p>
                                </div>
                            </div>
                            {(loading || paymentReference) && (
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                        {t('bookingUi.payment.paymentReferenceLabel')}
                                    </p>
                                    <p className="mt-1 font-mono text-base font-bold tracking-wide">
                                        {paymentReference ||
                                            t('bookingUi.payment.paymentReferencePending')}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                className="h-11 sm:flex-1"
                                type="button"
                            >
                                {t('bookingUi.payment.cancel')}
                            </Button>
                            <Button
                                className="h-11 sm:flex-1"
                                disabled={loading}
                                onClick={() => handlePayment({})}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <span className="truncate">
                                        {t('bookingUi.payment.pay', {
                                            amount: formatCurrency(displayAmount, currency),
                                        })}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {method === 'mpgs' && (
                    <div className="space-y-3">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-bold">{t('bookingUi.payment.secureMpgsTitle')}</p>
                                    <p className="text-xs leading-snug opacity-80">
                                        {t('bookingUi.payment.secureMpgsHint')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                className="h-11 sm:flex-1"
                                type="button"
                            >
                                {t('bookingUi.payment.cancel')}
                            </Button>
                            <Button
                                className="h-11 bg-[#EB001B] text-white hover:bg-[#c40018] sm:flex-1"
                                disabled={loading}
                                onClick={() => handlePayment({})}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <span className="truncate">
                                        {t('bookingUi.payment.pay', {
                                            amount: formatCurrency(displayAmount, currency),
                                        })}
                                    </span>
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
 * CBE Birr checkout  same compact pattern as Stripe/MPGS (info strip + fields + actions).
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
    onAbortUssd: () => void;
    abortLabel: string;
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
    onAbortUssd,
    abortLabel,
}) => {
    if (ussdSent) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
            >
                <div
                    className="flex items-start gap-3 rounded-xl border p-3 text-sm"
                    style={{
                        borderColor: `${accent}40`,
                        backgroundColor: `${accent}14`,
                        color: accent,
                    }}
                >
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="min-w-0 text-foreground">
                        <p className="font-bold" style={{ color: accent }}>
                            {ussdSentTitle}
                        </p>
                        <p className="text-xs leading-snug text-muted-foreground">
                            {ussdSentHint}
                            </p>
                        </div>
                </div>
                {paymentReference ? (
                        <div className="rounded-xl bg-muted px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {referenceLabel}
                            </p>
                        <p className="mt-0.5 font-mono text-sm font-semibold">
                            {paymentReference}
                        </p>
                        </div>
                ) : null}
                {ussdInstructions ? (
                    <p className="text-xs text-muted-foreground">{ussdInstructions}</p>
                ) : null}
                <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: accent }} />
                        {awaitingLabel}
                    </div>
                <Button
                    variant="outline"
                    className="h-11 w-full"
                    type="button"
                    onClick={onAbortUssd}
                >
                    {abortLabel}
                        </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
        >
            <div
                className="flex items-start gap-3 rounded-xl border p-3 text-sm"
                style={{
                    borderColor: `${accent}33`,
                    backgroundColor: `${accent}0f`,
                }}
            >
                {logo ? (
                    <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                        <Image src={logo} alt={bankName} fill className="object-contain p-1" />
                </div>
                ) : (
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
                )}
                <div className="min-w-0">
                    <p className="font-bold" style={{ color: accent }}>
                        {title}
                    </p>
                    <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="local-bank-phone" className="text-xs font-semibold">
                        {phoneLabel}
                    </Label>
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                        </span>
                        <Input
                            id="local-bank-phone"
                        inputMode="numeric"
                        autoComplete="tel-national"
                            placeholder={phonePlaceholder}
                            value={phone}
                            maxLength={10}
                        onChange={(e) =>
                            onPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        className="h-11 rounded-xl border-slate-200 bg-white pl-10 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 dark:bg-slate-900"
                        aria-describedby="local-bank-phone-hint"
                        />
                    </div>
                <p id="local-bank-phone-hint" className="text-[11px] text-muted-foreground">
                    {phoneHint}
                </p>
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            className="text-sm font-medium text-destructive"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                <Button
                    variant="outline"
                    className="h-11 sm:flex-1"
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                >
                        {cancelLabel}
                    </Button>
                    <Button
                    className="h-11 text-white hover:brightness-95 sm:flex-1"
                        style={{ backgroundColor: accent }}
                    disabled={loading || phone.length < 10}
                        onClick={onPay}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : payLabel}
                    </Button>
            </div>
        </motion.div>
    );
};
