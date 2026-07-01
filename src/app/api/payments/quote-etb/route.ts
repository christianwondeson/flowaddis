import { NextResponse } from 'next/server';
import { pickNestCreateSessionBody } from '@/lib/nest-checkout-body';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

/** Proxy verified ETB price quote for local checkout display. */
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.slice('Bearer '.length).trim();
        if (!idToken) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        try {
            await verifyFirebaseIdToken(idToken);
        } catch {
            return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
        }

        const body = await req.json();
        const nestBody = pickNestCreateSessionBody(body);

        let backendUrl: string;
        try {
            backendUrl = getSafeBackendBaseUrl();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Invalid BACKEND_URL';
            return NextResponse.json({ error: 'Server misconfiguration', message: msg }, { status: 500 });
        }

        const response = await fetch(`${backendUrl}/api/v1/payments/quote-etb`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify(nestBody),
        });

        const raw = await response.text();
        let data: { message?: string; error?: string; amount?: number; currency?: string };
        try {
            data = raw ? (JSON.parse(raw) as typeof data) : {};
        } catch {
            return NextResponse.json(
                { error: 'Invalid response from payment API', upstreamStatus: response.status },
                { status: 502 },
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: data.message || data.error || 'Failed to quote ETB price',
                    upstreamStatus: response.status,
                },
                { status: response.status },
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Quote ETB API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
