import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';

/** Proxy Nest GET/PUT /api/v1/admin/hotels/:id */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
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

        const { id } = await params;
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

        const response = await fetch(`${backendUrl}/api/v1/admin/hotels/${id}`, {
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
                {
                    error:
                        (data as { message?: string }).message ||
                        'Failed to load hotel',
                },
                { status: response.status },
            );
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error('Admin hotel GET proxy error', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
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

        const { id } = await params;
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
        const response = await fetch(`${backendUrl}/api/v1/admin/hotels/${id}`, {
            method: 'PUT',
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
                        'Failed to update hotel',
                },
                { status: response.status },
            );
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error('Admin hotel PUT proxy error', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
