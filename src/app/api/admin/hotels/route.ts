import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';

/** Proxy Nest GET/POST /api/v1/admin/hotels */
export async function GET(req: Request) {
    try {
        try {
            await assertFirebaseAndNestAdmin(req);
        } catch (e) {
            if (e instanceof CmsAuthError) {
                return NextResponse.json(
                    { error: e.message, code: e.code },
                    { status: e.status },
                );
            }
            throw e;
        }

        const { searchParams } = new URL(req.url);
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

        const url = new URL(`${backendUrl}/api/v1/admin/hotels`);
        searchParams.forEach((value, key) => {
            url.searchParams.append(key, value);
        });
        if (!url.searchParams.has('limit')) {
            url.searchParams.set('limit', '100');
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: req.headers.get('Authorization')!,
            },
            cache: 'no-store',
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: (data as { message?: string }).message || 'Failed to list hotels' },
                { status: response.status },
            );
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error('Admin hotels GET proxy error', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        try {
            await assertFirebaseAndNestAdmin(req);
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

        const body = await req.json();
        const response = await fetch(`${backendUrl}/api/v1/admin/hotels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: req.headers.get('Authorization')!,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                {
                    error:
                        (data as { message?: string }).message ||
                        'Failed to create hotel',
                },
                { status: response.status },
            );
        }
        return NextResponse.json(data, { status: response.status });
    } catch (e) {
        console.error('Admin hotels POST proxy error', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
