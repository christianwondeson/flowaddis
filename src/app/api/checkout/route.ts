import { NextResponse } from 'next/server';
import { pickNestCreateSessionBody } from '@/lib/nest-checkout-body';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';

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
        const nestBody = pickNestCreateSessionBody(body);

        // The NestJS backend URL - should be in .env
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        const apiUrl = `${backendUrl}/api/v1/payments/create-session`;

        // Forward only whitelisted fields (no client price / no unknown props for ValidationPipe)
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify(nestBody),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Failed to create checkout session' },
                { status: response.status }
            );
        }

        // Return the result (expected to contain 'url' or 'sessionId')
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Checkout API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
