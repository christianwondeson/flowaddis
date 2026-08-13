import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

type Ctx = { params: Promise<{ path?: string[] }> };

async function proxy(request: Request, ctx: Ctx) {
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
        return NextResponse.json(
            { error: 'Server misconfiguration', message: msg },
            { status: 500 },
        );
    }

    const { path } = await ctx.params;
    const segments = Array.isArray(path) ? path : [];
    const url = new URL(request.url);
    const upstream = `${backendUrl}/api/v1/hotel-admin/${segments.map(encodeURIComponent).join('/')}${url.search}`;

    // CBE USSD subscribe can exceed the default 20s; keep other routes snappy.
    const isCbeSubscribe = segments.join('/').includes('subscribe/cbe-birr');
    const timeoutMs = isCbeSubscribe ? 55_000 : 20_000;

    const init: RequestInit = {
        method: request.method,
        headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        const body = await request.text();
        if (body) init.body = body;
    }

    try {
        const response = await fetch(upstream, init);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                {
                    error:
                        (data as { message?: string }).message ||
                        (data as { error?: string }).error ||
                        'Upstream error',
                },
                { status: response.status },
            );
        }
        return NextResponse.json(data, { status: response.status });
    } catch (err) {
        const name = err instanceof Error ? err.name : '';
        const timedOut = name === 'TimeoutError' || name === 'AbortError';
        console.error('hotel-admin proxy failed', { upstream, err });
        return NextResponse.json(
            {
                error: timedOut
                    ? 'Hotel API timed out. Check Nest is running and the Postgres tunnel (DB_HOST:5432) is up.'
                    : 'Cannot reach Nest API. Ensure flowaddis-api is running on BACKEND_URL (http://127.0.0.1:4000).',
            },
            { status: 502 },
        );
    }
}

export async function GET(request: Request, ctx: Ctx) {
    return proxy(request, ctx);
}
export async function POST(request: Request, ctx: Ctx) {
    return proxy(request, ctx);
}
export async function PUT(request: Request, ctx: Ctx) {
    return proxy(request, ctx);
}
export async function PATCH(request: Request, ctx: Ctx) {
    return proxy(request, ctx);
}
export async function DELETE(request: Request, ctx: Ctx) {
    return proxy(request, ctx);
}
