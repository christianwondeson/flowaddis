import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';

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
        const range = searchParams.get('range') || '30days';

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

        const url = new URL(`${backendUrl}/api/v1/admin/dashboard/overview`);
        url.searchParams.set('range', range);

        const authHeader = req.headers.get('Authorization')!;
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            cache: 'no-store',
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                {
                    error:
                        (data as { message?: string }).message ||
                        'Failed to load dashboard',
                },
                { status: response.status },
            );
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Admin dashboard API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
