'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { resolveCheckoutReturnUrlForRequest } from '@/lib/checkout-return-url';
import {
  isValidMpgsSessionId,
  resolveTrustedMpgsCheckoutScriptUrl,
} from '@/lib/mpgs-checkout-security';

export type MpgsCheckoutRequest = {
  token: string;
  bookingType?: string;
  source?: string;
  externalItemId?: string;
  externalSnapshot?: Record<string, unknown>;
  /** i18n toast keys already resolved by caller */
  messages: {
    authFailed: string;
    initFailed: string;
  };
  onPaymentReference?: (ref: string) => void;
};

export type MpgsCheckoutResult =
  | { status: 'navigating' }
  | { status: 'failed'; error?: string };

/**
 * Starts MPGS Hosted Checkout: POST /api/checkout then redirect to /booking/mpgs-checkout.
 */
export function useMpgsCheckout() {
  const startMpgsCheckout = useCallback(
    async (req: MpgsCheckoutRequest): Promise<MpgsCheckoutResult> => {
      void resolveCheckoutReturnUrlForRequest();

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${req.token}`,
        },
        body: JSON.stringify({
          bookingType: req.bookingType,
          source: req.source,
          externalItemId: req.externalItemId,
          currency: 'USD',
          paymentChannel: 'mpgs',
          external_snapshot: req.externalSnapshot,
        }),
      });

      if (response.status === 401) {
        toast.error(req.messages.authFailed);
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
        req.onPaymentReference?.(resolvedRef);
        try {
          sessionStorage.setItem('last_pay_nar', resolvedRef);
        } catch {
          /* ignore */
        }
      }

      if (typeof sessionId === 'string' && isValidMpgsSessionId(sessionId)) {
        const trustedScriptUrl = resolveTrustedMpgsCheckoutScriptUrl(
          typeof checkoutScriptUrl === 'string' ? checkoutScriptUrl : undefined,
        );
        if (!trustedScriptUrl) {
          toast.error(req.messages.initFailed);
          return { status: 'failed', error: 'invalid_script' };
        }
        const ref = resolvedRef ?? '';
        const params = new URLSearchParams({
          session: sessionId.trim(),
          ...(ref ? { ref } : {}),
        });
        window.location.replace(`/booking/mpgs-checkout?${params.toString()}`);
        return { status: 'navigating' };
      }

      toast.error(error || req.messages.initFailed);
      return { status: 'failed', error: typeof error === 'string' ? error : 'init' };
    },
    [],
  );

  return { startMpgsCheckout };
}
