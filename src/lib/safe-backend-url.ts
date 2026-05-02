const MAX_URL_LEN = 2048;

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

/** Nest API base URL used by Next route handlers (server-side fetch only). */
export function getSafeBackendBaseUrl(): string {
    const raw = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
    return assertSafeHttpBaseUrl(raw, 'BACKEND_URL');
}
