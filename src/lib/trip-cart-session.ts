import type { TripItem } from '@/store/trip-store';

const SESSION_KEY = 'bookaddis_trip_cart_v1';

function isTripItem(x: unknown): x is TripItem {
    if (!x || typeof x !== 'object') return false;
    const o = x as Record<string, unknown>;
    return (
        typeof o.id === 'string' &&
        (o.type === 'flight' || o.type === 'hotel' || o.type === 'shuttle' || o.type === 'conference') &&
        typeof o.price === 'number' &&
        o.details !== undefined
    );
}

/** Persists pre-login / in-session cart so it survives refresh and sign-in (same browser tab). */
export function persistTripCart(items: TripItem[]): void {
    if (typeof window === 'undefined') return;
    try {
        if (!items.length) {
            window.sessionStorage.removeItem(SESSION_KEY);
            return;
        }
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(items));
    } catch {
        /* quota / private mode */
    }
}

export function loadTripCart(): TripItem[] | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return null;
        const items = parsed.filter(isTripItem);
        return items.length ? items : null;
    } catch {
        return null;
    }
}

export function clearTripCartSession(): void {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
        /* ignore */
    }
}
