/**
 * Allowed origins for Stripe checkout return (BookAddis main site + local dev).
 * Sync with flowaddis-api BookingsService allowlist.
 */
const ALLOWED_HOSTS = new Set([
    'bookaddis.com',
    'www.bookaddis.com',
    'localhost',
    '127.0.0.1',
]);

export const BOOKADDIS_HOME = 'https://bookaddis.com';

export function isAllowedReturnHost(hostname: string): boolean {
    return ALLOWED_HOSTS.has(hostname);
}

/**
 * Returns a safe URL to send users back to BookAddis (or the path they came from).
 */
export function sanitizeCheckoutReturnUrl(
    raw: string | null | undefined,
    fallback: string = BOOKADDIS_HOME,
): string {
    if (!raw || typeof raw !== 'string') return fallback;
    try {
        const u = new URL(raw);
        if (isAllowedReturnHost(u.hostname)) return u.toString();
    } catch {
        /* ignore */
    }
    return fallback;
}

/**
 * Resolve return URL for checkout: query param → sessionStorage → document.referrer.
 */
export function resolveCheckoutReturnUrlForRequest(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    const tryUrl = (value: string | null | undefined): string | undefined => {
        if (!value) return undefined;
        try {
            const u = new URL(value);
            if (isAllowedReturnHost(u.hostname)) return u.toString();
        } catch {
            /* ignore */
        }
        return undefined;
    };

    try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('returnUrl');
        if (q) {
            const decoded = (() => {
                try {
                    return decodeURIComponent(q);
                } catch {
                    return q;
                }
            })();
            const fromQuery = tryUrl(decoded);
            if (fromQuery) return fromQuery;
        }
    } catch {
        /* ignore */
    }

    try {
        const stored = sessionStorage.getItem('checkout_return_url');
        if (stored) {
            const fromStore = tryUrl(stored);
            if (fromStore) return fromStore;
        }
    } catch {
        /* ignore */
    }

    if (document.referrer) {
        const fromRef = tryUrl(document.referrer);
        if (fromRef) return fromRef;
    }

    return undefined;
}
