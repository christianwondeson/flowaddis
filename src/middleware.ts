import { NextResponse } from 'next/server';
import { APP_CONSTANTS } from '@/lib/constants';
import type { NextRequest } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';

const protectedRoutes = ['/dashboard', '/admin'];
const authRoutes = ['/signin', '/signup'];

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

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(APP_CONSTANTS.AUTH.COOKIE_NAME)?.value;

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute) {
        if (!token) {
            const url = new URL('/signin', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        try {
            await verifyFirebaseIdToken(token);
        } catch {
            const url = new URL('/signin', request.url);
            url.searchParams.set('redirect', pathname);
            const res = NextResponse.redirect(url);
            clearSessionCookie(res);
            return res;
        }
        return NextResponse.next();
    }

    if (isAuthRoute && token) {
        try {
            await verifyFirebaseIdToken(token);
        } catch {
            const res = NextResponse.next();
            clearSessionCookie(res);
            return res;
        }
        const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    ],
};
