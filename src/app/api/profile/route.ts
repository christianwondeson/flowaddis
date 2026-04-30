import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';

async function requireBearerToken(req: Request): Promise<string | NextResponse> {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = auth.slice('Bearer '.length).trim();
    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
        await verifyFirebaseIdToken(token);
    } catch {
        return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }
    return auth;
}

async function proxyToNest(req: Request, method: 'GET' | 'PATCH', body?: string) {
    const authOrError = await requireBearerToken(req);
    if (authOrError instanceof NextResponse) return authOrError;

    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
    const res = await fetch(`${backendUrl}/api/v1/users/me`, {
        method,
        headers: {
            Authorization: authOrError,
            ...(method === 'PATCH' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: method === 'PATCH' ? body : undefined,
    });

    const text = await res.text();
    let data: unknown;
    try {
        data = JSON.parse(text) as unknown;
    } catch {
        data = { error: text || 'Upstream error' };
    }
    return NextResponse.json(data, { status: res.status });
}

export async function GET(req: Request) {
    return proxyToNest(req, 'GET');
}

export async function PATCH(req: Request) {
    const body = await req.text();
    return proxyToNest(req, 'PATCH', body);
}
