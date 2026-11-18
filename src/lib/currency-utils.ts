import { getPublicEtbPerUsd, usdToEtbDisplay } from '@/lib/etb-usd';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

/** Fetch live ETB/USD from Nest FX endpoint; fall back to public env rate. */
export async function fetchEtbPerUsd(): Promise<number> {
  try {
    const backend = getSafeBackendBaseUrl();
    const res = await fetch(`${backend}/api/v1/fx/etb-usd`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const rate = Number(data?.etbPerUsd);
      if (Number.isFinite(rate) && rate > 0) return rate;
    }
  } catch {
    /* fallback */
  }
  return getPublicEtbPerUsd();
}

/** RapidAPI returns USD — convert list prices to ETB with live CBE rate. */
export function convertRapidApiHotelToEtb(
  h: Record<string, unknown> & {
    inventory_source?: string;
    price?: number;
    originalPrice?: number;
  },
  etbPerUsd: number,
) {
  if (!h || h.inventory_source !== 'rapidapi') return h;
  const priceUsd = Number(h.price) || 0;
  const origUsd = Number(h.originalPrice) || 0;
  return {
    ...h,
    price_usd: priceUsd,
    original_price_usd: origUsd || undefined,
    price: usdToEtbDisplay(priceUsd, etbPerUsd),
    originalPrice: origUsd ? usdToEtbDisplay(origUsd, etbPerUsd) : undefined,
    currency: 'ETB',
    fx_etb_per_usd: etbPerUsd,
    // Partner listings often mark "includes taxes" — we do not add tax ourselves.
    priceIncludesTaxes: false,
  };
}

export function nestCheckoutMoney(
  payload: Record<string, unknown>,
  fallbackAmount: number,
  fallbackCurrency: 'ETB' | 'USD',
): {
  amount: number;
  currency: 'ETB' | 'USD';
  paymentReference: string | null;
  bookingId: string | null;
} {
  const amountRaw = payload?.amount;
  const amount =
    typeof amountRaw === 'number' && Number.isFinite(amountRaw) && amountRaw > 0
      ? amountRaw
      : fallbackAmount;
  const cur = String(payload?.currency || fallbackCurrency).toUpperCase();
  const currency: 'ETB' | 'USD' = cur === 'USD' ? 'USD' : 'ETB';
  const paymentReference =
    typeof payload?.paymentReference === 'string'
      ? payload.paymentReference
      : typeof payload?.payNar === 'string'
        ? payload.payNar
        : null;
  const bookingId =
    typeof payload?.bookingId === 'string' ? payload.bookingId : null;
  return { amount, currency, paymentReference, bookingId };
}
