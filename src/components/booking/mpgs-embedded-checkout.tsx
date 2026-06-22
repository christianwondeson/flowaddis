'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import {
    isValidMpgsResultIndicator,
    isValidMpgsSessionId,
    resolveTrustedMpgsCheckoutScriptUrl,
} from '@/lib/mpgs-checkout-security';

declare global {
    interface Window {
        Checkout?: {
            configure: (cfg: { session: { id: string } }) => void;
            showEmbeddedPage: (selector: string) => void;
        };
        mpgsErrorCallback?: (error: unknown) => void;
        mpgsCompleteCallback?: (resultIndicator: string) => void;
    }
}

interface MpgsEmbeddedCheckoutProps {
    sessionId: string;
    scriptUrl: string;
    onError?: (message: string) => void;
    onComplete?: (resultIndicator: string) => void;
}

export function MpgsEmbeddedCheckout({
    sessionId,
    scriptUrl,
    onError,
    onComplete,
}: MpgsEmbeddedCheckoutProps) {
    const [scriptReady, setScriptReady] = useState(false);
    const [embeddedStarted, setEmbeddedStarted] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);
    const startedRef = useRef(false);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const trustedScriptUrl = useMemo(
        () => resolveTrustedMpgsCheckoutScriptUrl(scriptUrl),
        [scriptUrl],
    );

    useEffect(() => {
        if (!isValidMpgsSessionId(sessionId)) {
            const message = 'Invalid checkout session. Please restart payment.';
            setConfigError(message);
            onError?.(message);
            return;
        }
        if (!trustedScriptUrl) {
            const message = 'Checkout could not be loaded from an untrusted source.';
            setConfigError(message);
            onError?.(message);
        }
    }, [sessionId, trustedScriptUrl, onError]);

    const launchEmbedded = useCallback(() => {
        if (
            startedRef.current ||
            configError ||
            !isValidMpgsSessionId(sessionId) ||
            !trustedScriptUrl ||
            !window.Checkout
        ) {
            return;
        }
        try {
            window.Checkout.configure({ session: { id: sessionId.trim() } });
            window.Checkout.showEmbeddedPage('#mpgs-embed-target');
            startedRef.current = true;
            setEmbeddedStarted(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not start MPGS checkout';
            onError?.(message);
        }
    }, [sessionId, trustedScriptUrl, configError, onError]);

    useEffect(() => {
        window.mpgsErrorCallback = (error: unknown) => {
            const message =
                typeof error === 'string'
                    ? error
                    : error instanceof Error
                      ? error.message
                      : 'MPGS checkout error';
            onError?.(message);
        };
        window.mpgsCompleteCallback = (resultIndicator: string) => {
            if (!isValidMpgsResultIndicator(resultIndicator)) {
                onError?.('Payment result could not be verified.');
                return;
            }
            onCompleteRef.current?.(resultIndicator.trim());
        };
        return () => {
            delete window.mpgsErrorCallback;
            delete window.mpgsCompleteCallback;
        };
    }, [onError]);

    useEffect(() => {
        if (scriptReady) launchEmbedded();
    }, [scriptReady, launchEmbedded]);

    if (configError || !trustedScriptUrl) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {configError ?? 'Secure checkout is unavailable.'}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50/80 px-3 py-2 text-xs text-teal-800">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                    Card details are entered on Mastercard&apos;s secure page — BookAddis never sees
                    your card number.
                </span>
            </div>
            <Script
                src={trustedScriptUrl}
                strategy="afterInteractive"
                data-error="mpgsErrorCallback"
                data-complete="mpgsCompleteCallback"
                onLoad={() => setScriptReady(true)}
                onError={() => onError?.('Failed to load MPGS checkout script')}
            />
            {!embeddedStarted && (
                <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading secure checkout…
                </div>
            )}
            <div
                id="mpgs-embed-target"
                className="min-h-[420px] w-full rounded-xl border border-gray-100 bg-white"
            />
        </div>
    );
}
