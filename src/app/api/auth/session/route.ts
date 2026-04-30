import { NextResponse } from 'next/server';
import { APP_CONSTANTS } from '@/lib/constants';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';

function clearSessionCookie(response: NextResponse) {
    response.cookies.set({
        name: APP_CONSTANTS.AUTH.COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
    });
}

// POST: Verify Firebase ID token, then set HttpOnly session cookie
export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== 'string') {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        let payload: Awaited<ReturnType<typeof verifyFirebaseIdToken>>;
        try {
            payload = await verifyFirebaseIdToken(token);
        } catch {
            return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const expSec = typeof payload.exp === 'number' ? payload.exp : nowSec + 3600;
        /** Cookie lifetime matches Firebase ID token expiry (not a flat 24h), so stale sessions cannot linger. */
        const maxAge = Math.max(120, Math.min(3600, expSec - nowSec));

        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: APP_CONSTANTS.AUTH.COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge,
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        console.error('Session creation failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Destroy session (Clear Cookie)
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
}
