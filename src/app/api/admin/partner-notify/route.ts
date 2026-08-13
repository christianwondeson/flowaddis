import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';

/** Super Admin → Nest SMTP partner KYC emails. */
export async function POST(request: Request) {
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
        return NextResponse.json(
            {
                error: e instanceof Error ? e.message : 'Invalid BACKEND_URL',
            },
            { status: 500 },
        );
    }

    const body = await request.text();
    try {
        const res = await fetch(`${backendUrl}/api/v1/admin/partner-notify`, {
            method: 'POST',
            headers: {
                Authorization: request.headers.get('Authorization')!,
                'Content-Type': 'application/json',
            },
            body,
            cache: 'no-store',
            signal: AbortSignal.timeout(25_000),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error('[partner-notify]', e);
        return NextResponse.json(
            { error: 'Failed to send partner email', sent: false },
            { status: 502 },
        );
    }
}
