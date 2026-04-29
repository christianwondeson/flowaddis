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

        try {
            await verifyFirebaseIdToken(token);
        } catch {
            return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
        }

        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: APP_CONSTANTS.AUTH.COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: APP_CONSTANTS.AUTH.COOKIE_MAX_AGE,
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
