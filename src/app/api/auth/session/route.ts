import { NextResponse } from 'next/server';
import { APP_CONSTANTS } from '@/lib/constants';

// POST: Create a session (Set Cookie)
export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // In a real-world scenario (Future Step), we would verify this token using firebase-admin here.
        // For now, we trust the client-provided token but store it securely to prevent XSS theft.

        const response = NextResponse.json({ success: true });

        // Set HttpOnly Cookie
        response.cookies.set({
            name: APP_CONSTANTS.AUTH.COOKIE_NAME,
            value: token,
            httpOnly: true, // Critical: Not accessible via client-side JS
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            path: '/',
            maxAge: APP_CONSTANTS.AUTH.COOKIE_MAX_AGE,
            sameSite: 'lax', // Protects against CSRF
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

    // Clear Cookie
    response.cookies.set({
        name: APP_CONSTANTS.AUTH.COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0, // Expire immediately
        sameSite: 'lax',
    });

    return response;
}
