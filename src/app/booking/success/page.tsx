"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    ArrowRight,
    Download,
    Mail,
    Home,
    Loader2,
    Clock,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BOOKADDIS_HOME, sanitizeCheckoutReturnUrl } from '@/lib/checkout-return-url';
import { useTranslations } from '@/components/providers/locale-provider';
import { auth } from '@/lib/firebase';
import { formatCurrency } from '@/lib/currency';

type UiPhase = 'loading' | 'pending' | 'success' | 'failed' | 'expired';

function SuccessContent() {
    const { t } = useTranslations();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const refFromQuery = searchParams.get('ref');
    const pendingHint = searchParams.get('pending') === '1';
    const returnUrl = sanitizeCheckoutReturnUrl(searchParams.get('return_url'), BOOKADDIS_HOME);
    const [storedRef, setStoredRef] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [chargeQuote, setChargeQuote] = useState<{ amount: number; currency: string } | null>(
        null,
    );

    const paymentReference = refFromQuery || storedRef || null;

    const phase: UiPhase = (() => {
        if (sessionId) return 'success';
        if (!paymentStatus && pendingHint) return 'pending';
        if (!paymentStatus) return 'loading';
        if (paymentStatus === 'PAID' || paymentStatus === 'CONFIRMED') return 'success';
        if (paymentStatus === 'FAILED') return 'failed';
        if (paymentStatus === 'EXPIRED') return 'expired';
        if (paymentStatus === 'INITIATED') return 'pending';
        return 'loading';
    })();

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('last_pay_nar');
            if (saved) setStoredRef(saved);
            const quoteRaw = sessionStorage.getItem('last_checkout_quote');
            if (quoteRaw) {
                const parsed = JSON.parse(quoteRaw) as { amount?: number; currency?: string };
                if (typeof parsed.amount === 'number') {
                    setChargeQuote({
                        amount: parsed.amount,
                        currency: parsed.currency || 'ETB',
                    });
                }
            }
        } catch {
            /* ignore */
        }

        const pollStatus = async (ref: string) => {
            if (!auth?.currentUser) return null;
            try {
                const token = await auth.currentUser.getIdToken();
                const res = await fetch(`/api/payments/status/${encodeURIComponent(ref)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.status) {
                        setPaymentStatus(data.status);
                        return data.status as string;
                    }
                }
            } catch {
                /* ignore */
            }
            return null;
        };

        const ref = refFromQuery || sessionStorage.getItem('last_pay_nar');
        if (ref && !sessionId) {
            void pollStatus(ref);
            const interval = window.setInterval(async () => {
                const status = await pollStatus(ref);
                if (
                    status === 'PAID' ||
                    status === 'CONFIRMED' ||
                    status === 'FAILED' ||
                    status === 'EXPIRED'
                ) {
                    window.clearInterval(interval);
                }
            }, 4000);
            return () => window.clearInterval(interval);
        }
    }, [sessionId, refFromQuery, pendingHint]);

    const title =
        phase === 'success'
            ? t('bookingFlow.successTitle')
            : phase === 'pending'
              ? t('bookingFlow.pendingTitle')
              : phase === 'failed'
                ? t('bookingFlow.failedTitle')
                : phase === 'expired'
                  ? t('bookingFlow.expiredTitle')
                  : t('bookingFlow.pendingTitle');

    const body =
        phase === 'success'
            ? t('bookingFlow.successThankYou')
            : phase === 'pending'
              ? t('bookingFlow.pendingBody')
              : phase === 'failed'
                ? t('bookingFlow.failedBody')
                : phase === 'expired'
                  ? t('bookingFlow.expiredBody')
                  : t('bookingFlow.pendingBody');

    const Icon =
        phase === 'success'
            ? CheckCircle2
            : phase === 'failed' || phase === 'expired'
              ? XCircle
              : phase === 'pending' || phase === 'loading'
                ? Clock
                : CheckCircle2;

    const iconClass =
        phase === 'success'
            ? 'bg-green-50 text-green-500'
            : phase === 'failed' || phase === 'expired'
              ? 'bg-red-50 text-red-500'
              : 'bg-amber-50 text-amber-600';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-12 text-center border border-gray-100"
        >
            <div className="mb-8 flex justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${iconClass.split(' ')[0]}`}
                >
                    {phase === 'pending' || phase === 'loading' ? (
                        <Loader2 className={`w-10 h-10 animate-spin ${iconClass.split(' ').slice(1).join(' ')}`} />
                    ) : (
                        <Icon className={`w-10 h-10 ${iconClass.split(' ').slice(1).join(' ')}`} />
                    )}
                </motion.div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
            <p className="text-gray-500 mb-8">{body}</p>

            {chargeQuote && phase === 'pending' && (
                <p className="text-sm font-semibold text-gray-700 mb-6">
                    {t('bookingFlow.pendingAmount', {
                        amount: formatCurrency(chargeQuote.amount, chargeQuote.currency),
                    })}
                </p>
            )}

            <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {t('bookingFlow.eticketLabel')}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                            {phase === 'success'
                                ? t('bookingFlow.eticketHint')
                                : t('bookingFlow.eticketPendingHint')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Download className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {t('bookingFlow.bookingIdLabel')}
                        </p>
                        <p className="text-sm font-semibold text-gray-700 font-mono tracking-wide">
                            {paymentReference ? paymentReference : t('bookingFlow.bookingIdFallback')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t('bookingFlow.bookingIdHint')}</p>
                        {paymentStatus && phase !== 'success' && (
                            <p className="text-xs text-amber-600 mt-2">
                                {t('bookingUi.payment.pollPaymentStatus')}: {paymentStatus}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Button
                    type="button"
                    className="w-full bg-brand-primary hover:bg-brand-dark text-white rounded-xl h-12 font-bold shadow-lg shadow-brand-primary/20"
                    onClick={() => {
                        window.location.href = returnUrl;
                    }}
                >
                    {t('bookingFlow.backToBookAddis')} <Home className="ml-2 w-4 h-4" />
                </Button>
                <Button asChild variant="ghost" className="w-full text-gray-500 hover:text-brand-primary h-12 rounded-xl font-bold">
                    <Link href="/">{t('bookingFlow.stayOnBookAddis')}</Link>
                </Button>
                {phase === 'success' && (
                    <Button variant="ghost" className="w-full text-gray-500 hover:text-brand-primary h-12 rounded-xl font-bold">
                        {t('bookingFlow.viewBookingDetails')} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

export default function BookingSuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    </div>
                }
            >
                <SuccessContent />
            </Suspense>
        </div>
    );
}
