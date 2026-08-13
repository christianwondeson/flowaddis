import type { HotelPartnerStatus, User, UserRole } from '@/types/auth';
import { getSafeAppRedirectPath } from '@/lib/safe-redirect';

/** Marketing / search pages  after sign-in go to dashboard, not back to browse UI */
const BROWSE_PATH_PREFIXES = ['/flights', '/hotels', '/shuttles', '/conferences', '/car-rentals'] as const;

/** Guest messaging under a hotel  honor return after sign-in */
function isHotelMessagesPath(path: string): boolean {
    return /^\/hotels\/[^/]+\/messages\/?$/.test(path);
}

/**
 * Only these redirects are honored after sign-in. Public browse URLs (e.g. /flights)
 * are ignored so users land on /dashboard or /admin instead of the homepage/search UI.
 */
export function shouldHonorPostLoginRedirect(path: string): boolean {
    const p = path.trim();
    if (!p || p === '/' || p === '/signin' || p === '/signup') {
        return false;
    }
    if (isHotelMessagesPath(p)) {
        return true;
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

function defaultHomeForRole(role: UserRole): string {
    if (role === 'admin') return '/admin';
    if (role === 'hotel_admin' || role === 'hotel_staff') return '/admin/hotel';
    return '/dashboard';
}

function canEnterAdminPath(role: UserRole, path: string): boolean {
    // Super Admin uses /admin + /admin/partners (Hotels)  never the hotel partner portal.
    if (role === 'admin') {
        if (path === '/admin/hotel' || path.startsWith('/admin/hotel/')) {
            return false;
        }
        return path === '/admin' || path.startsWith('/admin/');
    }
    if (role === 'hotel_admin' || role === 'hotel_staff') {
        return path === '/admin/hotel' || path.startsWith('/admin/hotel/');
    }
    return false;
}

/**
 * Where to send the user after sign-in.
 * - Honors redirect only for account/booking/admin paths (see shouldHonorPostLoginRedirect).
 * - Super admins → `/admin`; hotel operators → `/admin/hotel`; others → `/dashboard`.
 */
export function getPostLoginPath(role: UserRole, redirectFromQuery: string | null | undefined): string {
    const from = getSafeAppRedirectPath(redirectFromQuery ?? null, '/');

    if (shouldHonorPostLoginRedirect(from)) {
        if (from.startsWith('/admin') && !canEnterAdminPath(role, from)) {
            // Map legacy /admin/hotel/* bookmarks for Super Admin → inventory.
            if (
                role === 'admin' &&
                (from === '/admin/hotel' || from.startsWith('/admin/hotel/'))
            ) {
                if (from === '/admin/hotel' || from === '/admin/hotel/') {
                    return '/admin/partners?tab=hotels';
                }
                return (
                    from.replace(/^\/admin\/hotel/, '/admin/inventory') ||
                    '/admin/partners?tab=hotels'
                );
            }
            return defaultHomeForRole(role);
        }
        /** Middleware may send admins to /dashboard  always prefer their console home */
        if (
            (role === 'admin' || role === 'hotel_admin' || role === 'hotel_staff') &&
            (from === '/dashboard' || from.startsWith('/dashboard/'))
        ) {
            return defaultHomeForRole(role);
        }
        return from;
    }

    return defaultHomeForRole(role);
}

/**
 * Full post-auth destination including hotel partner KYC gates
 * (draft → finish signup, pending → waiting room).
 */
export function getPostAuthPath(
    user: Pick<User, 'role'> & { hotelPartnerStatus?: HotelPartnerStatus | null },
    redirectFromQuery?: string | null,
): string {
    const status = user.hotelPartnerStatus;
    if (status === 'draft') return '/signup?type=hotel_partner';
    if (status === 'pending') return '/partner/pending';
    if (status === 'rejected') return '/profile';
    return getPostLoginPath(user.role, redirectFromQuery);
}

/** Build /auth/continue URL so sign-in always resolves role + partner status once. */
export function buildAuthContinueHref(redirectFromQuery?: string | null): string {
    const from = getSafeAppRedirectPath(redirectFromQuery ?? null, '/');
    if (!from || from === '/') return '/auth/continue';
    return `/auth/continue?redirect=${encodeURIComponent(from)}`;
}
