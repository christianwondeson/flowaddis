/**
 * Hotel inventory: Nest + Hotelbeds is the default for hotels.
 * Set `NEXT_PUBLIC_HOTEL_INVENTORY_PROVIDER=rapidapi` only if you must use Booking.com via RapidAPI.
 */
export function useHotelbedsInventory(): boolean {
    const p = process.env.NEXT_PUBLIC_HOTEL_INVENTORY_PROVIDER?.trim().toLowerCase();
    if (p === 'rapidapi') return false;
    return true;
}

export function hotelInventorySource(): 'hotelbeds' | 'rapidapi' {
    return useHotelbedsInventory() ? 'hotelbeds' : 'rapidapi';
}

/** Server-only: logs which inventory backend a Route Handler will use (no browser noise). */
function shouldLogHotelInventoryRouting(): boolean {
    if (typeof window !== 'undefined') return false;
    const v = process.env.HOTEL_INVENTORY_DEBUG?.toLowerCase();
    if (v === '0' || v === 'false' || v === 'off') return false;
    if (v === '1' || v === 'true' || v === 'on') return true;
    return process.env.NODE_ENV === 'development';
}

export function logHotelInventoryRouting(
    route: string,
    detail: Record<string, string | number | boolean | undefined>,
): void {
    if (!shouldLogHotelInventoryRouting()) return;
    console.log('[hotel-inventory]', route, { provider: hotelInventorySource(), ...detail });
}

/** Nest API base URL for server-side Hotelbeds proxies (no trailing slash). */
export function nestHotelbedsBackendUrl(): string {
    if (typeof window !== 'undefined') return '';
    let base = (process.env.BACKEND_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
    try {
        const u = new URL(base);
        if (u.hostname === 'localhost') {
            u.hostname = '127.0.0.1';
            base = u.origin;
        }
    } catch {
        /* keep base as-is */
    }
    return base;
}

/** Map Next locale (e.g. en-gb) to Hotelbeds Content API language codes (3-letter). */
export function hotelbedsLanguageFromLocale(locale: string | null | undefined): string {
    if (!locale) return 'ENG';
    const l = locale.toLowerCase().replace('_', '-');
    if (l.startsWith('en')) return 'ENG';
    if (l.startsWith('es')) return 'SPA';
    if (l.startsWith('fr')) return 'FRE';
    if (l.startsWith('de')) return 'GER';
    if (l.startsWith('it')) return 'ITA';
    return 'ENG';
}
