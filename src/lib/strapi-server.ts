import { assertSafeHttpBaseUrl } from '@/lib/safe-backend-url';

export type CmsResource = 'hotels' | 'shuttles' | 'conferences' | 'flights';

export const CMS_RESOURCES: CmsResource[] = ['hotels', 'shuttles', 'conferences', 'flights'];

export function isCmsResource(s: string): s is CmsResource {
    return CMS_RESOURCES.includes(s as CmsResource);
}

export function getStrapiConfig(): { baseUrl: string; token: string } {
    const raw = process.env.STRAPI_URL?.trim() || '';
    const token = process.env.STRAPI_API_TOKEN?.trim();
    if (!raw) {
        throw new Error(
            'STRAPI_URL is not set. For local Strapi use STRAPI_URL=http://127.0.0.1:1337 in flowaddis/.env.local (see env.example).',
        );
    }
    if (!token) {
        const hint =
            raw.includes('127.0.0.1') || raw.includes('localhost')
                ? ' Create a token at http://127.0.0.1:1337/admin → Settings → API Tokens (Full access), set STRAPI_API_TOKEN in .env.local, and restart npm run dev. Do not use STRAPI_API_TOKEN= (empty) — that blocks the token from .env.'
                : ' Set STRAPI_API_TOKEN in .env or .env.local and restart npm run dev.';
        throw new Error(`STRAPI_API_TOKEN is missing or empty.${hint}`);
    }
    const baseUrl = assertSafeHttpBaseUrl(raw, 'STRAPI_URL');
    return { baseUrl, token };
}

/** Relative path only (e.g. `/api/hotels`); blocks absolute URLs that could confuse fetch. */
function resolveStrapiUrl(baseUrl: string, path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    if (path.startsWith('http') || path.startsWith('//') || p.includes('..')) {
        throw new Error('Invalid Strapi request path');
    }
    return `${baseUrl}${p}`;
}

/** Safe log label (origin only, no token). */
export function getStrapiOriginForLogs(): string {
    try {
        return new URL(getStrapiConfig().baseUrl).origin;
    } catch {
        return process.env.STRAPI_URL?.trim() || '(STRAPI_URL unset)';
    }
}

export async function strapiFetch(path: string, init?: RequestInit): Promise<Response> {
    const { baseUrl, token } = getStrapiConfig();
    const url = resolveStrapiUrl(baseUrl, path);
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, {
        ...init,
        headers,
    });
}

/** Parse Strapi v5 error JSON for logs and API responses. */
export function formatStrapiErrorBody(text: string, status: number): string {
    try {
        const j = JSON.parse(text) as {
            error?: { message?: string; details?: unknown };
            message?: string;
        };
        const msg = j.error?.message || j.message;
        if (msg) {
            return `Strapi ${status}: ${msg}`;
        }
    } catch {
        /* not JSON */
    }
    const snippet = text.trim().slice(0, 280);
    return snippet ? `Strapi ${status}: ${snippet}` : `Strapi ${status}`;
}

const HOTEL_KEYS = new Set([
    'name',
    'slug',
    'location',
    'description',
    'rating',
    'price_per_night',
    'currency',
    'price_category',
    'status',
    'facilities',
    'primary_image',
    'gallery',
]);

const SHUTTLE_KEYS = new Set([
    'name',
    'vehicle_type',
    'pickup_location',
    'dropoff_location',
    'schedule',
    'capacity',
    'notes',
    'status',
]);

const CONFERENCE_KEYS = new Set([
    'name',
    'venue',
    'start_at',
    'end_at',
    'capacity',
    'organizer',
    'description',
    'banner',
    'status',
]);

const FLIGHT_KEYS = new Set([
    'airline_name',
    'flight_number',
    'origin_code',
    'destination_code',
    'departure_at',
    'arrival_at',
    'price_usd',
    'cabin_class',
    'status',
]);

export function pickStrapiData(resource: CmsResource, raw: Record<string, unknown>): Record<string, unknown> {
    const allow =
        resource === 'hotels'
            ? HOTEL_KEYS
            : resource === 'shuttles'
              ? SHUTTLE_KEYS
              : resource === 'conferences'
                ? CONFERENCE_KEYS
                : FLIGHT_KEYS;

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
        if (allow.has(k) && v !== undefined) {
            out[k] = v;
        }
    }
    return out;
}
