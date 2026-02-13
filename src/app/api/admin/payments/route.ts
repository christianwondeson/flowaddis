import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const limit = searchParams.get('limit') || '20';
        const offset = searchParams.get('offset') || '0';

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        const url = new URL(`${backendUrl}/api/v1/admin/payments`);

        if (status) url.searchParams.append('status', status);
        url.searchParams.append('limit', limit);
        url.searchParams.append('offset', offset);

        const authHeader = req.headers.get('Authorization');

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader && { 'Authorization': authHeader }),
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Failed to fetch payments' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Admin Payments API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
