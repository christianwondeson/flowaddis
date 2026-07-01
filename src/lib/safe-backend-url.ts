const MAX_URL_LEN = 2048;

/** Public Nest API used when deployed without a valid BACKEND_URL (Firebase / Cloud Run). */
export const PRODUCTION_BACKEND_URL_DEFAULT = 'https://api.bookaddis.com';

/**
 * Validates `BACKEND_URL` / Strapi-style base URLs: http(s), no embedded credentials,
 * bounded length. Reduces impact of misconfiguration (SSRF-style misuse of server-side fetch).
 */
export function assertSafeHttpBaseUrl(raw: string, envName: string): string {
    const trimmed = raw.trim().replace(/\/+$/, '');
    if (!trimmed || trimmed.length > MAX_URL_LEN) {
        throw new Error(`${envName} is missing or too long`);
    }
    let u: URL;
    try {
        u = new URL(trimmed);
    } catch {
        throw new Error(`${envName} must be a valid absolute URL`);
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        throw new Error(`${envName} must use http or https`);
    }
    if (u.username || u.password) {
        throw new Error(`${envName} must not include username or password`);
    }
    if (u.pathname.includes('//') || trimmed.includes('@')) {
        throw new Error(`${envName} has an invalid shape`);
    }
    return trimmed;
}

/** True when this Node process is running on Firebase SSR / Cloud Run (not your laptop). */
function isDeployedServerless(): boolean {
    return Boolean(
        process.env.K_SERVICE ||
            process.env.FUNCTION_TARGET ||
            process.env.GCLOUD_PROJECT ||
            process.env.GOOGLE_CLOUD_PROJECT
    );
}

/** Nest API base URL used by Next route handlers (server-side fetch only). */
export function getSafeBackendBaseUrl(): string {
    const configured = process.env.BACKEND_URL?.trim();
    if (isDeployedServerless() && !configured) {
        return assertSafeHttpBaseUrl(PRODUCTION_BACKEND_URL_DEFAULT, 'BACKEND_URL');
    }
    const raw = configured || 'http://127.0.0.1:4000';
    const url = assertSafeHttpBaseUrl(raw, 'BACKEND_URL');
    if (isDeployedServerless()) {
        const host = new URL(url).hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
            return assertSafeHttpBaseUrl(PRODUCTION_BACKEND_URL_DEFAULT, 'BACKEND_URL');
        }
    }
    return url;
}
