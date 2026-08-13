import { usdToEtbDisplay } from '@/lib/etb-usd';

export function formatCurrency(amount: number, currency?: string): string {
    // BookAddis default sell currency is ETB; USD also supported.
    const validCurrency = currency === 'USD' || currency === 'ETB' ? currency : 'ETB';

    return new Intl.NumberFormat(validCurrency === 'ETB' ? 'en-ET' : 'en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Display hotel prices in ETB. RapidAPI USD amounts are multiplied by live ETB/USD.
 * Direct inventory already priced in ETB  no conversion.
 */
export function formatHotelPrice(
    amount: number,
    currency?: string | null,
    etbPerUsd?: number,
): string {
    const cur = String(currency || 'ETB').toUpperCase();
    if (cur === 'USD') {
        return formatCurrency(usdToEtbDisplay(amount, etbPerUsd), 'ETB');
    }
    return formatCurrency(amount, cur === 'ETB' ? 'ETB' : 'ETB');
}
