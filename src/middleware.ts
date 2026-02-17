import { NextResponse } from 'next/server';
import { APP_CONSTANTS } from '@/lib/constants';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/admin']; // Removed root route
const authRoutes = ['/signin', '/signup'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(APP_CONSTANTS.AUTH.COOKIE_NAME)?.value;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Redirect to signin if accessing protected route without token
    if (isProtectedRoute && !token) {
        const url = new URL('/signin', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Redirect to home if accessing auth routes with token
    if (isAuthRoute && token) {
        // If there is a redirect param, use it
        const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    ],
};
