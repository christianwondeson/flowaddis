import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // The NestJS backend URL - should be in .env
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        const apiUrl = `${backendUrl}/api/v1/payments/create-session`;


        // Check Authorization header presence (do not log the token)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.warn('⚠️ Missing Authorization header on /api/checkout request');
        } else {
            // Log header presence only
        }

        // Forward the request to the NestJS backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward authorization header if it exists
                ...(authHeader && { 'Authorization': authHeader }),
            },
            body: JSON.stringify(body),
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
