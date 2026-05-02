import { NextResponse } from 'next/server';
import { pickNestCreateSessionBody } from '@/lib/nest-checkout-body';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

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
        const apiUrl = `${backendUrl}/api/v1/payments/create-session`;

        let response: Response;
        try {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authHeader,
                },
                body: JSON.stringify(nestBody),
            });
        } catch (err) {
            console.error('Checkout: upstream fetch failed', { apiUrl, err });
            return NextResponse.json(
                {
                    error: 'Payment service unreachable',
                    message:
                        'Next could not reach the Nest API. Set BACKEND_URL to https://api.bookaddis.com (GitHub secret for deploy + Firebase env) and ensure the API is up with TLS.',
                },
                { status: 502 }
            );
        }

        const raw = await response.text();
        let data: { message?: string; error?: string; sessionId?: string; url?: string };
        try {
            data = raw ? (JSON.parse(raw) as typeof data) : {};
        } catch {
            console.error('Checkout: non-JSON from API', response.status, raw.slice(0, 400));
            return NextResponse.json(
                { error: 'Invalid response from payment API', upstreamStatus: response.status },
                { status: 502 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: data.message || data.error || 'Failed to create checkout session',
                    upstreamStatus: response.status,
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
