import { NextResponse } from 'next/server';
import { APP_CONSTANTS } from '@/lib/constants';
import type { NextRequest } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeAppRedirectPath } from '@/lib/safe-redirect';
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isAppLocale } from '@/lib/i18n/config';

const protectedRoutes = ['/dashboard', '/admin', '/trips', '/profile', '/settings'];
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

function ensureLocaleCookie(request: NextRequest, response: NextResponse) {
    const raw = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
    if (!raw || !isAppLocale(raw)) {
        response.cookies.set({
            name: LOCALE_COOKIE_NAME,
            value: DEFAULT_LOCALE,
            path: '/',
            maxAge: 31536000,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    }
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
            const res = NextResponse.redirect(url);
            ensureLocaleCookie(request, res);
            return res;
        }
        try {
            await verifyFirebaseIdToken(token);
        } catch {
            const url = new URL('/signin', request.url);
            url.searchParams.set('redirect', pathname);
            const res = NextResponse.redirect(url);
            clearSessionCookie(res);
            ensureLocaleCookie(request, res);
            return res;
        }
        const ok = NextResponse.next();
        ensureLocaleCookie(request, ok);
        return ok;
    }

    if (isAuthRoute && token) {
        try {
            await verifyFirebaseIdToken(token);
        } catch {
            const res = NextResponse.next();
            clearSessionCookie(res);
            ensureLocaleCookie(request, res);
            return res;
        }
        const rawRedirect = request.nextUrl.searchParams.get('redirect');
        const redirectPath = getSafeAppRedirectPath(rawRedirect, '/');
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    const out = NextResponse.next();
    ensureLocaleCookie(request, out);
    return out;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    ],
};
