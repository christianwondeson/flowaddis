import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Stripe.js sets first-party cookies (__stripe_mid, __stripe_sid, etc.) for Radar / device signals.
 * Merchants cannot set HttpOnly on those cookies — Stripe’s client must read them.
 * Mitigations: strict Content-Security-Policy (see next.config.ts), no inline script for unrelated logic,
 * and XSS-safe patterns in your own code.
 */

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
    if (!stripePromise) {
        const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!publicKey) {
            console.warn('Stripe publishable key is missing from environment variables');
        }
        stripePromise = loadStripe(publicKey || '');
    }
    return stripePromise;
};
