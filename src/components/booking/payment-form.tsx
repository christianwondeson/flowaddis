"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
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
    getCheckoutLocalChannels,
    isCbeBirrCheckoutEnabled,
    isLocalPaymentChannel,
    type PaymentChannelId,
} from '@/lib/payment-channels';
import { buildNestCheckoutMetadata, isValidCbeBirrMsisdn } from '@/lib/cbe-birr-checkout';
import { resolveCheckoutPhone } from '@/lib/booking-contact-prefill';
import { estimateEtbFromListingAmount, type EtbQuote } from '@/lib/etb-checkout';
import { useAuth } from '@/components/providers/auth-provider';

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
    /** E.164 or local ET phone from booking form — pre-fills CBE Birr USSD push. */
    customerPhone?: string;
    /** Account profile phone — when set, CBE Birr must use this number (server-enforced). */
    profilePhone?: string;
}

type PaymentMethod = 'telebirr' | 'cbebirr' | 'stripe' | 'pay_on_site';

const SHOW_CBE_BIRR = isCbeBirrCheckoutEnabled();

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
    customerPhone: customerPhoneProp = '',
    profilePhone = '',
}) => {
    const { t, locale } = useTranslations();
    const { user } = useAuth();

    const resolvedProfilePhone = profilePhone?.trim() || user?.phone?.trim() || '';
    const lockedCbePhone = useMemo(() => {
        if (resolvedProfilePhone && isValidCbeBirrMsisdn(resolvedProfilePhone)) {
            return resolvedProfilePhone;
        }
        return null;
    }, [resolvedProfilePhone]);

    const effectiveCustomerPhone = resolveCheckoutPhone(resolvedProfilePhone, customerPhoneProp);

    const telebirrSchema = useMemo(
        () =>
            z.object({
                phone: z.string().regex(/^(09|07)\d{8}$/, t('bookingUi.payment.validationTelebirr')),
            }),
        [t],
    );

    const cbebirrSchema = useMemo(
        () =>
            z.object({
                phone: z
                    .string()
                    .min(1, t('bookingUi.payment.cbeBirrPhoneRequired'))
                    .refine((v) => isValidCbeBirrMsisdn(v), t('bookingUi.payment.cbeBirrPhoneInvalid')),
            }),
        [t],
    );

    const localChannels = getCheckoutLocalChannels();
    const showLocalPayments = SHOW_CBE_BIRR && isLocal && localChannels.length > 0;
    const defaultLocalChannel = localChannels[0]?.id ?? 'cbe_birr';

    const [method, setMethod] = useState<PaymentMethod>(
        showLocalPayments ? 'cbebirr' : 'stripe',
    );
    const [paymentChannel, setPaymentChannel] = useState<PaymentChannelId>(
        showLocalPayments ? defaultLocalChannel : 'stripe',
    );
    const [loading, setLoading] = useState(false);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const [ussdInstructions, setUssdInstructions] = useState<string | null>(null);
    const [awaitingBankPayment, setAwaitingBankPayment] = useState(false);
    const [verifiedCharge, setVerifiedCharge] = useState<{ amount: number; currency: string } | null>(
        null,
    );
    const [etbQuote, setEtbQuote] = useState<EtbQuote | null>(null);
    const [etbQuoteLoading, setEtbQuoteLoading] = useState(false);

    const listingCurrency = (currencyCode || 'USD').toUpperCase();

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

    // Server-verified ETB price for local rails (same RapidAPI re-fetch as checkout)
    useEffect(() => {
        if (!showLocalPayments || !auth?.currentUser) return;
        if (
            (bookingType === 'flight' || bookingType === 'hotel') &&
            (!externalItemId || externalItemId === 'N/A')
        ) {
            return;
        }

        let cancelled = false;
        void (async () => {
            setEtbQuoteLoading(true);
            try {
                const token = await auth.currentUser!.getIdToken();
                const res = await fetch('/api/checkout/quote', {
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
                        external_snapshot: externalSnapshot,
                        metadata: buildNestCheckoutMetadata(externalSnapshot),
                    }),
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled || typeof data.amount !== 'number') return;
                const quote: EtbQuote = {
                    amount: data.amount,
                    currency: 'ETB',
                    verified: true,
                };
                setEtbQuote(quote);
                setVerifiedCharge({ amount: data.amount, currency: 'ETB' });
            } catch {
                /* quote optional — fallback estimate shown */
            } finally {
                if (!cancelled) setEtbQuoteLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        showLocalPayments,
        bookingType,
        source,
        externalItemId,
        externalSnapshot,
    ]);

    const stripeDisplayAmount = amount;
    const stripeDisplayCurrency = listingCurrency === 'ETB' ? 'ETB' : 'USD';
    const localEtbAmount =
        etbQuote?.amount ??
        verifiedCharge?.amount ??
        estimateEtbFromListingAmount(amount, listingCurrency);

    const isLocalMethod = method === 'telebirr' || method === 'cbebirr';
    const displayAmount = isLocalMethod ? localEtbAmount : stripeDisplayAmount;
    const displayCurrency = isLocalMethod ? 'ETB' : stripeDisplayCurrency;

    const telebirrForm = useForm({
        resolver: zodResolver(telebirrSchema),
        defaultValues: { phone: '' },
    });

    const cbebirrForm = useForm({
        resolver: zodResolver(cbebirrSchema),
        defaultValues: { phone: lockedCbePhone || effectiveCustomerPhone || '' },
    });

    useEffect(() => {
        const next = lockedCbePhone || effectiveCustomerPhone;
        if (next) {
            cbebirrForm.setValue('phone', next, { shouldValidate: true });
        }
    }, [lockedCbePhone, effectiveCustomerPhone, cbebirrForm]);

    // We no longer need a react-hook-form for stripe as it's a redirect

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
            (showLocalPayments && isLocalPaymentChannel(paymentChannel));

        const isCbeBirrRail = isBankRail && paymentChannel === 'cbe_birr';

        if (method === 'stripe' || isBankRail) {
            setPaymentReference(null);
            setUssdInstructions(null);
            setAwaitingBankPayment(false);
            try {
                // Ensure user is logged in
                if (!auth?.currentUser) {
                    toast.error(t('bookingUi.payment.toastSignIn'));
                    setLoading(false);
                    return;
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
                    setLoading(false);
                    return;
                }

                // Force-refresh Firebase ID token to avoid invalid/expired tokens
                const token = await auth.currentUser.getIdToken(true);
                void resolveCheckoutReturnUrlForRequest();

                let checkoutMetadata: Record<string, unknown> | undefined;
                if (isCbeBirrRail) {
                    const phoneFromForm = cbebirrForm.getValues('phone')?.trim();
                    const msisdnSource = lockedCbePhone || phoneFromForm || effectiveCustomerPhone;
                    if (!msisdnSource || !isValidCbeBirrMsisdn(msisdnSource)) {
                        toast.error(t('bookingUi.payment.cbeBirrPhoneInvalid'));
                        setLoading(false);
                        return;
                    }
                    checkoutMetadata = buildNestCheckoutMetadata(externalSnapshot, msisdnSource);
                } else if (isBankRail) {
                    checkoutMetadata = buildNestCheckoutMetadata(externalSnapshot);
                }

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        bookingType,
                        source,
                        externalItemId,
                        currency: isBankRail ? 'ETB' : currencyCode || 'USD',
                        paymentChannel: method === 'stripe' ? 'stripe' : paymentChannel,
                        external_snapshot: externalSnapshot,
                        ...(checkoutMetadata ? { metadata: checkoutMetadata } : {}),
                    }),
                });

                // Handle response
                if (response.status === 401) {
                    toast.error(t('bookingUi.payment.toastAuthFailed'));
                }
                const payload = await response.json();
                const {
                    url,
                    error,
                    sessionId,
                    paymentReference: payRef,
                    payNar,
                    paymentUrl,
                    ussdInstructions: ussd,
                    awaitingBankPayment: awaitingPush,
                    amount: verifiedAmount,
                    currency: verifiedCurrency,
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

                if (typeof ussd === 'string') {
                    setUssdInstructions(ussd);
                }

                if (typeof verifiedAmount === 'number' && Number.isFinite(verifiedAmount)) {
                    setVerifiedCharge({
                        amount: verifiedAmount,
                        currency: typeof verifiedCurrency === 'string' ? verifiedCurrency : 'ETB',
                    });
                    try {
                        sessionStorage.setItem(
                            'last_checkout_quote',
                            JSON.stringify({
                                amount: verifiedAmount,
                                currency: verifiedCurrency || 'ETB',
                            }),
                        );
                    } catch {
                        /* ignore */
                    }
                }

                const redirectUrl = paymentUrl || url;
                if (isCbeBirrRail && awaitingPush && resolvedRef) {
                    toast.success(t('bookingUi.payment.cbeBirrUssdSent'));
                    setAwaitingBankPayment(true);
                    window.location.href = `/booking/success?ref=${encodeURIComponent(resolvedRef)}&pending=1`;
                    return;
                }
                if (redirectUrl && isBankRail) {
                    setAwaitingBankPayment(true);
                    window.location.href = redirectUrl;
                    return;
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
                if (error) {
                    toast.error(error);
                }
            } catch (err) {
                toast.error(t('bookingUi.payment.toastStripeInit'));
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

    return (
        <div className="space-y-8 overflow-x-hidden">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-brand-dark dark:text-foreground">{t('bookingUi.payment.chooseMethod')}</h3>
                <p className="text-gray-600 dark:text-slate-300 text-base">
                    {t('bookingUi.payment.totalAmount')}{' '}
                    <span className="text-brand-primary font-bold text-2xl">
                        {formatCurrency(displayAmount, displayCurrency)}
                    </span>
                    {showLocalPayments && isLocalMethod && etbQuoteLoading && (
                        <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-brand-primary" />
                    )}
                </p>
                {showLocalPayments && isLocalMethod && (
                    <p className="text-xs text-gray-500">
                        {etbQuoteLoading
                            ? t('bookingUi.payment.etbQuoteLoading')
                            : etbQuote?.verified
                              ? t('bookingUi.payment.etbQuoteVerified')
                              : t('bookingUi.payment.etbQuoteEstimate')}
                    </p>
                )}
            </div>

            <div
                className={`grid gap-4 md:gap-6 ${
                    showLocalPayments
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1'
                }`}
            >
                {showLocalPayments && (
                    <>
                        {localChannels.map((ch) => (
                            <button
                                key={ch.id}
                                type="button"
                                onClick={() => {
                                    setMethod('cbebirr');
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
                    </>
                )}

                <button
                    type="button"
                    onClick={() => setMethod('stripe')}
                    className={`p-4 md:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 min-h-[120px] md:min-h-[160px] ${method === 'stripe'
                        ? 'border-[#635BFF] bg-[#635BFF]/10 shadow-lg ring-2 ring-[#635BFF]/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-[#635BFF]/40 hover:shadow-md bg-white dark:bg-slate-800/80'
                        } ${!showLocalPayments ? 'w-full' : ''}`}
                >
                    <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden relative ${method === 'stripe' ? 'scale-110 shadow-lg' : 'opacity-80'}`}>
                        {/* Colorful Gradient Card Background */}
                        <div className="absolute inset-0 bg-linear-to-br from-[#0061ff] via-[#6033ff] to-[#ff00c6] animate-gradient-xy"></div>
                        {/* Decorative elements to make it look like a card */}
                        <div className="absolute top-2 left-2 w-6 h-4 bg-white/20 rounded-sm blur-[1px]"></div>
                        <div className="absolute bottom-2 right-2 flex gap-1">
                            <div className="w-4 h-4 rounded-full bg-red-500/80"></div>
                            <div className="w-4 h-4 rounded-full bg-yellow-500/80 -ml-2"></div>
                        </div>
                        <CreditCard className="w-6 h-6 md:w-10 md:h-10 text-white relative z-10" />
                    </div>
                    <div className="text-center">
                        <span className={`block text-sm uppercase tracking-wide font-bold transition-colors ${method === 'stripe' ? 'text-[#635BFF]' : 'text-gray-600'}`}>{t('bookingUi.payment.internationalCards')}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-500 font-medium">{t('bookingUi.payment.visa')}</span>
                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            <span className="text-[10px] text-gray-500 font-medium">{t('bookingUi.payment.mastercard')}</span>
                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            <span className="text-[10px] text-gray-500 font-medium">{t('bookingUi.payment.amex')}</span>
                        </div>
                    </div>
                </button>
            </div>

            <div className="space-y-4">
                {showLocalPayments && method === 'cbebirr' && (
                    <form onSubmit={cbebirrForm.handleSubmit(onSubmit)} className="space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <div className="bg-[#006838]/10 p-4 rounded-xl text-sm text-[#006838] border border-[#006838]/20">
                                <p className="font-bold">
                                    {paymentChannel === 'cbe_birr'
                                        ? t('bookingUi.payment.cbeBirrTitle')
                                        : t('bookingUi.payment.localBanksTitle')}
                                </p>
                                <p className="text-xs mt-1 opacity-90">
                                    {paymentChannel === 'cbe_birr'
                                        ? t('bookingUi.payment.cbeBirrHint')
                                        : t('bookingUi.payment.localBanksHint')}
                                </p>
                            </div>
                            {paymentChannel === 'cbe_birr' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                        {t('bookingUi.payment.cbeBirrPhone')}
                                    </label>
                                    <Input
                                        {...cbebirrForm.register('phone')}
                                        placeholder="0912345678"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        readOnly={!!lockedCbePhone}
                                        className={`rounded-xl ${lockedCbePhone ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                    />
                                    {cbebirrForm.formState.errors.phone && (
                                        <p className="text-red-500 text-xs">
                                            {cbebirrForm.formState.errors.phone.message}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        {lockedCbePhone
                                            ? t('bookingUi.payment.cbeBirrPhoneLocked')
                                            : t('bookingUi.payment.cbeBirrPhoneHint')}
                                    </p>
                                </div>
                            )}
                            {ussdInstructions && (
                                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-sm border border-slate-200 dark:border-slate-600">
                                    <p className="font-semibold mb-1">{t('bookingUi.payment.awaitingPayment')}</p>
                                    <p>{ussdInstructions}</p>
                                </div>
                            )}
                        </motion.div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={onCancel} className="flex-1" type="button">
                                {t('bookingUi.payment.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-[#006838] hover:bg-[#005a32] text-white"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : paymentChannel === 'cbe_birr' ? (
                                    t('bookingUi.payment.cbeBirrPay', {
                                        amount: formatCurrency(displayAmount, displayCurrency),
                                    })
                                ) : (
                                    t('bookingUi.payment.pay', { amount: formatCurrency(displayAmount, displayCurrency) })
                                )}
                            </Button>
                        </div>
                    </form>
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
                                    t('bookingUi.payment.pay', { amount: formatCurrency(displayAmount, displayCurrency) })
                                )}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
