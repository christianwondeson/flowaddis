/**
 * Client display fallback for ETB↔USD.
 * Prefer Nest quote-etb (live CBE remittance rate). Env is last-resort only.
 */

const DEFAULT_ETB_PER_USD = 130;

export function getPublicEtbPerUsd(): number {
    const n = Number.parseFloat(
        String(process.env.NEXT_PUBLIC_ETB_PER_USD || '').trim(),
    );
    if (!Number.isFinite(n) || n < 1 || n > 10000) return DEFAULT_ETB_PER_USD;
    return n;
}

export function usdToEtbDisplay(
    usdAmount: number,
    etbPerUsd = getPublicEtbPerUsd(),
): number {
    if (!Number.isFinite(usdAmount) || usdAmount <= 0) return 0;
    const rate = etbPerUsd > 0 ? etbPerUsd : DEFAULT_ETB_PER_USD;
    return Math.round(usdAmount * rate * 100) / 100;
}

export function etbToUsdDisplay(
    etbAmount: number,
    etbPerUsd = getPublicEtbPerUsd(),
): number {
    if (!Number.isFinite(etbAmount) || etbAmount <= 0) return 0;
    const rate = etbPerUsd > 0 ? etbPerUsd : DEFAULT_ETB_PER_USD;
    return Math.round((etbAmount / rate) * 100) / 100;
}
