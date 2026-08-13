import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { getPublicEtbPerUsd } from '@/lib/etb-usd';

export const dynamic = 'force-dynamic';

/** Public proxy for live ETB/USD (Nest CbeFxService). */
export async function GET() {
    try {
        const backend = getSafeBackendBaseUrl();
        const res = await fetch(`${backend}/api/v1/fx/etb-usd`, {
            next: { revalidate: 60 },
        });
        if (res.ok) {
            const data = await res.json();
            const rate = Number(data?.etbPerUsd);
            if (Number.isFinite(rate) && rate > 0) {
                return NextResponse.json({
                    etbPerUsd: rate,
                    source: data.source || 'cbe_remittance',
                    fetchedAt: data.fetchedAt || new Date().toISOString(),
                });
            }
        }
    } catch (e) {
        console.warn('FX proxy failed:', (e as Error)?.message);
    }

    const fallback = getPublicEtbPerUsd();
    return NextResponse.json({
        etbPerUsd: fallback,
        source: 'env_fallback',
        fetchedAt: new Date().toISOString(),
    });
}
