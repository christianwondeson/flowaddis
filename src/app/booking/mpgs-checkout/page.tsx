'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    isValidMpgsSessionId,
    resolveMpgsCheckoutScriptUrl,
    resolveTrustedMpgsCheckoutScriptUrl,
} from '@/lib/mpgs-checkout-security';
import { useTranslations } from '@/components/providers/locale-provider';

declare global {
    interface Window {
        Checkout?: {
            configure: (cfg: { session: { id: string } }) => void;
            showPaymentPage: () => void;
        };
        mpgsErrorCallback?: (error: unknown) => void;
    }
}

function MpgsCheckoutContent() {
    const { t } = useTranslations();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session')?.trim() ?? '';
    const [error, setError] = useState<string | null>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const launchedRef = useRef(false);

    const scriptUrl = useMemo(() => resolveMpgsCheckoutScriptUrl(), []);
    const trustedScriptUrl = useMemo(
        () => resolveTrustedMpgsCheckoutScriptUrl(scriptUrl),
        [scriptUrl],
    );
    const sessionValid = isValidMpgsSessionId(sessionId);

    const handleError = useCallback((message: string) => {
        setError(message);
        toast.error(message);
    }, []);

    useEffect(() => {
        if (!sessionValid) {
            setError(t('bookingFlow.mpgsCheckout.invalidSessionHint'));
            return;
        }
        if (!trustedScriptUrl) {
            setError(t('bookingFlow.mpgsCheckout.errorHint'));
        }
    }, [sessionValid, trustedScriptUrl, t]);

    useEffect(() => {
        window.mpgsErrorCallback = (err: unknown) => {
            const message =
                typeof err === 'string'
                    ? err
                    : err instanceof Error
                      ? err.message
                      : t('bookingFlow.mpgsCheckout.errorHint');
            handleError(message);
        };
        return () => {
            delete window.mpgsErrorCallback;
        };
    }, [handleError, t]);

    useEffect(() => {
        if (
            launchedRef.current ||
            error ||
            !scriptReady ||
            !sessionValid ||
            !trustedScriptUrl ||
            !window.Checkout
        ) {
            return;
        }
        try {
            window.Checkout.configure({ session: { id: sessionId } });
            window.Checkout.showPaymentPage();
            launchedRef.current = true;
        } catch (err) {
            handleError(err instanceof Error ? err.message : t('bookingFlow.mpgsCheckout.errorHint'));
        }
    }, [scriptReady, sessionValid, trustedScriptUrl, sessionId, error, handleError, t]);

    if (!sessionValid || error) {
        return (
            <div className="max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
                <p className="text-lg font-bold text-gray-900">
                    {t('bookingFlow.mpgsCheckout.invalidSessionTitle')}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    {error ?? t('bookingFlow.mpgsCheckout.invalidSessionHint')}
                </p>
                <Button asChild className="mt-6 w-full">
                    <Link href="/">{t('bookingFlow.mpgsCheckout.backHome')}</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <Script
                src={trustedScriptUrl!}
                strategy="afterInteractive"
                data-error="mpgsErrorCallback"
                onLoad={() => setScriptReady(true)}
                onError={() => handleError(t('bookingFlow.mpgsCheckout.errorHint'))}
            />
            <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#EB001B]" aria-hidden />
                <p className="text-sm font-medium text-gray-600">
                    {t('bookingFlow.mpgsCheckout.redirectingTitle')}
                </p>
            </div>
        </>
    );
}

export default function MpgsCheckoutPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-4">
            <Suspense fallback={null}>
                <MpgsCheckoutContent />
            </Suspense>
        </div>
    );
}
