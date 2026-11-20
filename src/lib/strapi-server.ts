import { assertSafeHttpBaseUrl } from '@/lib/safe-backend-url';
import { PRODUCTION_CMS_URL } from '@/lib/cms-media-url';

const LOCAL_ORIGIN = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?/i;

export const PRODUCTION_STRAPI_TOKEN =
    '5ff658da8ad5ee391a6c4cd5a77ffefbaebaf5da7535af3d555ddf2835f03ddf3bc90904bd513f456c964d190063023f56bb61f7ebf8712b76348a21040cc33a78151a6fdf1872a8540a5cea7740b31bd4149762356bad4e5106db2210c5b063cf5dc357e1ff6e74dfac17f1249a08936d1b94f31fbe97eeec4c47c5698e2585';

/** Bracket access so Next does not bake laptop `.env.local` into the Cloud Run bundle. */
function runtimeEnv(name: string): string {
    return String(process.env[name] ?? '').trim();
}

function isDeployedServerless(): boolean {
    // Cloud Run / Firebase SSR only. Do not use GCLOUD_PROJECT — gcloud CLI sets it locally.
    return Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET);
}

export type CmsResource = 'hotels' | 'shuttles' | 'conferences' | 'flights';

export const CMS_RESOURCES: CmsResource[] = ['hotels', 'shuttles', 'conferences', 'flights'];

export function isCmsResource(s: string): s is CmsResource {
    return CMS_RESOURCES.includes(s as CmsResource);
}

export function getStrapiConfig(): { baseUrl: string; token: string } {
    let raw = runtimeEnv('STRAPI_URL') || runtimeEnv('NEXT_PUBLIC_STRAPI_URL');
    let token = runtimeEnv('STRAPI_API_TOKEN');

    if (isDeployedServerless() && (!raw || LOCAL_ORIGIN.test(raw))) {
        raw = PRODUCTION_CMS_URL;
        if (!token) token = PRODUCTION_STRAPI_TOKEN;
    }

    if (!raw) {
        raw = PRODUCTION_CMS_URL;
    }
    if (!token && (raw === PRODUCTION_CMS_URL || LOCAL_ORIGIN.test(raw))) {
        token = PRODUCTION_STRAPI_TOKEN;
    }

    const baseUrl = assertSafeHttpBaseUrl(raw, 'STRAPI_URL');
    return { baseUrl, token: token || PRODUCTION_STRAPI_TOKEN };
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

    // If local Strapi is configured, attempt fetch with a short timeout.
    // If it fails with ECONNREFUSED or aborts, gracefully fall back to production Strapi.
    const isLocal = LOCAL_ORIGIN.test(baseUrl);
    try {
        const controller = new AbortController();
        const timeoutMs = isLocal ? 2500 : 15000;
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(url, {
            ...init,
            headers,
            signal: init?.signal || controller.signal,
        });
        clearTimeout(timer);
        return res;
    } catch (err: unknown) {
        if (isLocal && baseUrl !== PRODUCTION_CMS_URL) {
            console.warn(
                `[strapiFetch] Local Strapi (${baseUrl}) unreachable (${String(err)}). Falling back to production CMS: ${PRODUCTION_CMS_URL}`,
            );
            const prodUrl = resolveStrapiUrl(PRODUCTION_CMS_URL, path);
            const prodHeaders = new Headers(init?.headers);
            prodHeaders.set('Authorization', `Bearer ${PRODUCTION_STRAPI_TOKEN}`);
            return fetch(prodUrl, {
                ...init,
                headers: prodHeaders,
            });
        }
        throw err;
    }
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
