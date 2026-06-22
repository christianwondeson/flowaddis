/**
 * ETB display helpers for local checkout (CBE Birr).
 * Server quote from /api/checkout/quote is authoritative; fallback rate is estimate only.
 */

export function getUsdToEtbDisplayRate(): number {
    const raw = process.env.NEXT_PUBLIC_USD_ETB_DISPLAY_RATE;
    const parsed = raw ? Number.parseFloat(raw) : Number.NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return 57.5;
}

/** Rough ETB estimate when server quote is still loading. */
export function estimateEtbFromListingAmount(amount: number, listingCurrency = 'USD'): number {
    const code = listingCurrency.toUpperCase();
    if (code === 'ETB') return Math.round(amount);
    return Math.round(amount * getUsdToEtbDisplayRate());
}

export type EtbQuote = {
    amount: number;
    currency: 'ETB';
    verified: boolean;
};
