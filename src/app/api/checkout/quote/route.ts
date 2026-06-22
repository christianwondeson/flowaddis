import { NextResponse } from 'next/server';
import { pickNestCreateSessionBody } from '@/lib/nest-checkout-body';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

/** Server-verified ETB quote for local payment UI (CBE Birr, etc.). */
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
        const nestBody = {
            ...pickNestCreateSessionBody(body),
            currency: 'ETB',
        };

        let backendUrl: string;
        try {
            backendUrl = getSafeBackendBaseUrl();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Invalid BACKEND_URL';
            return NextResponse.json({ error: 'Server misconfiguration', message: msg }, { status: 500 });
        }
        const apiUrl = `${backendUrl}/api/v1/payments/quote-etb`;

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
            console.error('Quote: upstream fetch failed', { apiUrl, err });
            return NextResponse.json({ error: 'Payment service unreachable' }, { status: 502 });
        }

        const raw = await response.text();
        let data: { message?: string; error?: string; amount?: number; currency?: string };
        try {
            data = raw ? (JSON.parse(raw) as typeof data) : {};
        } catch {
            return NextResponse.json({ error: 'Invalid response from payment API' }, { status: 502 });
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || data.error || 'Failed to quote ETB price' },
                { status: response.status },
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Quote API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
