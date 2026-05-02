import { NextRequest, NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { isLikelyFirebaseUid } from '@/lib/admin-firebase-uid';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const { uid } = await params;
        if (!isLikelyFirebaseUid(uid)) {
            return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
        }
        let backendUrl: string;
        try {
            backendUrl = getSafeBackendBaseUrl();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Invalid BACKEND_URL';
            return NextResponse.json({ error: 'Server misconfiguration', message: msg }, { status: 500 });
        }
        const url = `${backendUrl}/api/v1/admin/payments/user/${encodeURIComponent(uid)}`;

        const authHeader = req.headers.get('Authorization');

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader && { 'Authorization': authHeader }),
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Failed to fetch user payments' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Admin User Payments API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
