import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';

/** Guest verified review submit → Nest */
export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await ctx.params;
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Sign in required to leave a review' },
                { status: 401 },
            );
        }
        try {
            await verifyFirebaseIdToken(authHeader.slice(7).trim());
        } catch {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const body = await req.json();
        const backend = getSafeBackendBaseUrl();
        const res = await fetch(
            `${backend}/api/v1/hotels/${encodeURIComponent(id)}/reviews`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authHeader,
                },
                body: JSON.stringify(body),
            },
        );
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error('Review submit error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
