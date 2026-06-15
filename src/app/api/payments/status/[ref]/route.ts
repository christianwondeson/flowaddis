import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

export async function GET(
    req: Request,
    context: { params: Promise<{ ref: string }> },
) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.slice('Bearer '.length).trim();
        await verifyFirebaseIdToken(idToken);

        const { ref } = await context.params;
        if (!ref) {
            return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
        }

        const backendUrl = getSafeBackendBaseUrl();
        const response = await fetch(
            `${backendUrl}/api/v1/payments/status/${encodeURIComponent(ref)}`,
            {
                headers: { Authorization: authHeader },
            },
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: unknown) {
        console.error('Payment status proxy error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
