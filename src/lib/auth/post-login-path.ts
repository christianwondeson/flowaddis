import type { UserRole } from '@/types/auth';
import { getSafeAppRedirectPath } from '@/lib/safe-redirect';

/** Marketing / search pages — after sign-in go to dashboard, not back to browse UI */
const BROWSE_PATH_PREFIXES = ['/flights', '/hotels', '/shuttles', '/conferences', '/car-rentals'] as const;

/**
 * Only these redirects are honored after sign-in. Public browse URLs (e.g. /flights)
 * are ignored so users land on /dashboard or /admin instead of the homepage/search UI.
 */
export function shouldHonorPostLoginRedirect(path: string): boolean {
    const p = path.trim();
    if (!p || p === '/' || p === '/signin' || p === '/signup') {
        return false;
    }
    for (const prefix of BROWSE_PATH_PREFIXES) {
        if (p === prefix || p.startsWith(`${prefix}/`)) {
            return false;
        }
    }
    return (
        p.startsWith('/dashboard') ||
        p.startsWith('/trips') ||
        p.startsWith('/profile') ||
        p.startsWith('/settings') ||
        p.startsWith('/admin') ||
        p.startsWith('/booking')
    );
}

/**
 * Build sign-in URL query: omit redirect on browse pages so post-login uses dashboard/admin defaults.
 */
export function buildSignInHref(
    currentPath: string,
    basePath: '/signin' | '/signup' = '/signin',
): string {
    const path = currentPath.split('?')[0] ?? '/';
    if (!shouldHonorPostLoginRedirect(path)) {
        return basePath;
    }
    return `${basePath}?redirect=${encodeURIComponent(currentPath)}`;
}

/**
 * Where to send the user after sign-in.
 * - Honors redirect only for account/booking/admin paths (see shouldHonorPostLoginRedirect).
 * - Admins default to `/admin`; everyone else to `/dashboard`.
 */
export function getPostLoginPath(role: UserRole, redirectFromQuery: string | null | undefined): string {
    const from = getSafeAppRedirectPath(redirectFromQuery ?? null, '/');

    if (shouldHonorPostLoginRedirect(from)) {
        if (role !== 'admin' && from.startsWith('/admin')) {
            return '/dashboard';
        }
        /** Middleware may send admins to /dashboard — always prefer admin home */
        if (role === 'admin' && (from === '/dashboard' || from.startsWith('/dashboard/'))) {
            return '/admin';
        }
        return from;
    }

    return role === 'admin' ? '/admin' : '/dashboard';
}
