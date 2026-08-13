/**
 * Booking.com-style rate breakdown for hotel admins.
 * Net = what you enter on the calendar; guest total adds tax + service when prices are net.
 * Working currency is ETB or USD  VAT/service apply the same way in either.
 */

export type PricingCurrency = 'ETB' | 'USD';

export type PricingSettings = {
    /** Display / sell currency for this property’s rates */
    currency: PricingCurrency;
    /** VAT / city tax % on the net rate */
    taxPercent: number;
    /** Service / resort fee % on the net rate */
    servicePercent: number;
    /**
     * true = calendar amounts already include tax+service (extract net for display).
     * false = calendar amounts are net; guest pays net + tax + service.
     */
    pricesIncludeTax: boolean;
};

export const DEFAULT_PRICING: PricingSettings = {
    currency: 'ETB',
    taxPercent: 15,
    servicePercent: 10,
    pricesIncludeTax: false,
};

export function normalizeCurrency(raw?: string | null): PricingCurrency {
    return String(raw || '').toUpperCase() === 'USD' ? 'USD' : 'ETB';
}

export type PriceBreakdown = {
    net: number;
    tax: number;
    service: number;
    guestTotal: number;
    currency: string;
};

export function normalizePricing(raw?: Partial<PricingSettings> | null): PricingSettings {
    return {
        currency: normalizeCurrency(raw?.currency ?? DEFAULT_PRICING.currency),
        taxPercent: clampPct(raw?.taxPercent ?? DEFAULT_PRICING.taxPercent),
        servicePercent: clampPct(raw?.servicePercent ?? DEFAULT_PRICING.servicePercent),
        pricesIncludeTax: Boolean(raw?.pricesIncludeTax),
    };
}

function clampPct(n: number) {
    if (!Number.isFinite(n) || n < 0) return 0;
    if (n > 100) return 100;
    return Math.round(n * 100) / 100;
}

/** Break down a calendar/base amount using admin pricing settings. */
export function breakdownPrice(
    amount: number | null | undefined,
    currency: string,
    settings: PricingSettings,
): PriceBreakdown | null {
    if (amount == null || Number.isNaN(Number(amount))) return null;
    const value = Math.max(0, Number(amount));
    const taxR = settings.taxPercent / 100;
    const svcR = settings.servicePercent / 100;

    if (settings.pricesIncludeTax) {
        const divisor = 1 + taxR + svcR;
        const net = divisor > 0 ? value / divisor : value;
        const tax = net * taxR;
        const service = net * svcR;
        return roundBreakdown(net, tax, service, value, currency);
    }

    const tax = value * taxR;
    const service = value * svcR;
    const guestTotal = value + tax + service;
    return roundBreakdown(value, tax, service, guestTotal, currency);
}

function roundBreakdown(
    net: number,
    tax: number,
    service: number,
    guestTotal: number,
    currency: string,
): PriceBreakdown {
    const r = (n: number) => Math.round(n * 100) / 100;
    return {
        net: r(net),
        tax: r(tax),
        service: r(service),
        guestTotal: r(guestTotal),
        currency,
    };
}

export function formatMoney(amount: number, currency = 'ETB') {
    return `${currency} ${amount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}
