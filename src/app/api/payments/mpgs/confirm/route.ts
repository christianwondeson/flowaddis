import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { isValidMpgsResultIndicator } from '@/lib/mpgs-checkout-security';

const PAYNAR_PATTERN = /^FA-\d{8}-[A-HJ-NP-Z2-9]{6}$/;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.slice('Bearer '.length).trim();
        await verifyFirebaseIdToken(idToken);

        const body = await req.json();
        const paymentReference =
            typeof body.paymentReference === 'string'
                ? body.paymentReference.trim()
                : typeof body.ref === 'string'
                  ? body.ref.trim()
                  : '';
        const resultIndicator =
            typeof body.resultIndicator === 'string' ? body.resultIndicator.trim() : '';

        if (!paymentReference || !resultIndicator) {
            return NextResponse.json(
                { error: 'paymentReference and resultIndicator are required' },
                { status: 400 },
            );
        }
        if (!PAYNAR_PATTERN.test(paymentReference) || !isValidMpgsResultIndicator(resultIndicator)) {
            return NextResponse.json({ error: 'Invalid payment confirmation payload' }, { status: 400 });
        }

        const backendUrl = getSafeBackendBaseUrl();
        const response = await fetch(`${backendUrl}/api/v1/payments/mpgs/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify({ paymentReference, resultIndicator }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: unknown) {
        console.error('MPGS confirm proxy error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
