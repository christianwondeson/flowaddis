import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';

type Ctx = { params: Promise<{ path?: string[] }> };

/**
 * Super Admin inventory proxy → Nest `/api/v1/admin/...`
 * (hotels, room-types, calendars, rate-plans  not the hotel partner portal).
 */
async function proxy(request: Request, ctx: Ctx) {
    try {
        await assertFirebaseAndNestAdmin(request);
    } catch (e) {
        if (e instanceof CmsAuthError) {
            return NextResponse.json(
                { error: e.message, code: e.code },
                { status: e.status },
            );
        }
        throw e;
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
    const upstream = `${backendUrl}/api/v1/admin/${segments.map(encodeURIComponent).join('/')}${url.search}`;

    const init: RequestInit = {
        method: request.method,
        headers: {
            Authorization: request.headers.get('Authorization')!,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(25_000),
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
                        `Upstream ${response.status}`,
                },
                { status: response.status },
            );
        }
        return NextResponse.json(data, { status: response.status });
    } catch (e) {
        const msg = (e as Error).message || 'Upstream failed';
        if (msg.includes('abort') || msg.includes('Timeout')) {
            return NextResponse.json(
                { error: 'Inventory API timed out  is Nest running?' },
                { status: 504 },
            );
        }
        console.error('Admin inventory proxy error', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
