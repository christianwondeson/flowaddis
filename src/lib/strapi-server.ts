import { assertSafeHttpBaseUrl } from '@/lib/safe-backend-url';

export type CmsResource = 'hotels' | 'shuttles' | 'conferences' | 'flights';

export const CMS_RESOURCES: CmsResource[] = ['hotels', 'shuttles', 'conferences', 'flights'];

export function isCmsResource(s: string): s is CmsResource {
    return CMS_RESOURCES.includes(s as CmsResource);
}

export function getStrapiConfig(): { baseUrl: string; token: string } {
    const raw = process.env.STRAPI_URL?.trim() || '';
    const token = process.env.STRAPI_API_TOKEN?.trim();
    if (!raw || !token) {
        throw new Error('STRAPI_URL and STRAPI_API_TOKEN must be set for CMS proxy');
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

export async function strapiFetch(path: string, init?: RequestInit): Promise<Response> {
    const { baseUrl, token } = getStrapiConfig();
    const url = resolveStrapiUrl(baseUrl, path);
    return fetch(url, {
        ...init,
        headers: {
            ...(init?.headers as Record<string, string>),
            Authorization: `Bearer ${token}`,
        },
    });
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
