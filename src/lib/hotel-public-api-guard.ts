import { NextResponse } from 'next/server';

/**
 * Public hotel detail proxies (RapidAPI) are not multi-tenant secrets, but we still:
 * - Reject malformed / probe IDs (reduces injection and arbitrary upstream queries)
 * - Rate-limit per IP to slow enumeration and scraping
 *
 * True "object ownership" does not apply to published OTA listings; optional auth gating
 * can be added later via env if you need login-only catalog.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Booking / provider hotel IDs: alphanumeric, dash, underscore; bounded length (incl. UUID-style). */
const HOTEL_ID_RE = /^[a-zA-Z0-9_-]{3,40}$/;

export function getClientIp(request: Request): string {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) {
        return xff.split(',')[0]?.trim().slice(0, 64) || 'unknown';
    }
    return request.headers.get('x-real-ip')?.trim().slice(0, 64) || 'unknown';
}

function pruneBuckets(now: number) {
    if (buckets.size < 8000) return;
    for (const [k, v] of buckets) {
        if (now > v.resetAt) buckets.delete(k);
    }
}

function rateLimitHotelPublicApi(ip: string): NextResponse | null {
    const now = Date.now();
    pruneBuckets(now);
    const key = `hotel:${ip}`;
    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
        b = { count: 0, resetAt: now + WINDOW_MS };
        buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again shortly.' },
            { status: 429, headers: { 'Retry-After': '60' } },
        );
    }
    return null;
}

export type HotelDetailGuardResult =
    | { ok: true; hotelId: string }
    | { ok: false; response: NextResponse };

/**
 * Validates `hotelId` and applies a shared per-IP rate limit for hotel detail endpoints.
 */
export function assertHotelDetailAccess(request: Request, rawHotelId: string | null): HotelDetailGuardResult {
    if (!rawHotelId?.trim()) {
        return { ok: false, response: NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 }) };
    }
    const hotelId = rawHotelId.trim();
    if (!HOTEL_ID_RE.test(hotelId)) {
        return { ok: false, response: NextResponse.json({ error: 'Invalid hotel ID' }, { status: 400 }) };
    }

    const limited = rateLimitHotelPublicApi(getClientIp(request));
    if (limited) {
        return { ok: false, response: limited };
    }

    return { ok: true, hotelId };
}
