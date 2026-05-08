import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

/**
 * Proxies to Nest GET /api/v1/bookings/me — Postgres bookings for the signed-in user (Stripe/RapidAPI).
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
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

        let backendUrl: string;
        try {
            backendUrl = getSafeBackendBaseUrl();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Invalid BACKEND_URL';
            return NextResponse.json({ error: 'Server misconfiguration', message: msg }, { status: 500 });
        }

        const url = new URL(request.url);
        const limit = url.searchParams.get('limit');

        const upstream = `${backendUrl}/api/v1/bookings/me${limit ? `?limit=${encodeURIComponent(limit)}` : ''}`;

        let response: Response;
        try {
            response = await fetch(upstream, {
                method: 'GET',
                headers: { Authorization: authHeader },
                cache: 'no-store',
            });
        } catch (err) {
            console.error('Bookings me: upstream fetch failed', { upstream, err });
            return NextResponse.json(
                {
                    error: 'Booking service unreachable',
                    message:
                        'Could not reach the API. Set BACKEND_URL (e.g. https://api.bookaddis.com) and ensure Nest is running.',
                },
                { status: 502 },
            );
        }

        const raw = await response.text();
        let data: unknown;
        try {
            data = raw ? JSON.parse(raw) : [];
        } catch {
            return NextResponse.json(
                { error: 'Invalid response from booking API', upstreamStatus: response.status },
                { status: 502 },
            );
        }

        if (!response.ok) {
            const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
            return NextResponse.json(
                {
                    error:
                        typeof obj.message === 'string'
                            ? obj.message
                            : typeof obj.error === 'string'
                              ? obj.error
                              : 'Failed to load bookings',
                    upstreamStatus: response.status,
                },
                { status: response.status },
            );
        }

        return NextResponse.json(data);
    } catch (e) {
        console.error('GET /api/bookings/me', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
