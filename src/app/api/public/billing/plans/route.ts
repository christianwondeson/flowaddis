import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { BILLING_PLANS } from '@/lib/billing-plans';

/**
 * Public plans for homepage / signup.
 * Prefers Nest active plans; falls back to marketing catalog if API is down.
 */
export async function GET() {
    try {
        const backendUrl = getSafeBackendBaseUrl();
        const res = await fetch(`${backendUrl}/api/v1/public/billing/plans`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(8_000),
        });
        if (res.ok) {
            const plans = await res.json();
            return NextResponse.json({ source: 'api', plans });
        }
    } catch {
        /* fall through */
    }

    return NextResponse.json({
        source: 'catalog',
        plans: BILLING_PLANS.map((p) => ({
            code: p.code,
            name: p.name,
            description: p.tagline,
            price_amount: String(p.priceEtb),
            currency: p.currency,
            period_days: 30,
            trial_days: p.trialDays,
            is_active: true,
        })),
    });
}
