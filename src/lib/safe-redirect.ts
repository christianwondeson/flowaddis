/**
 * Same-origin relative paths only — blocks open redirects via
 * `//evil.com`, `\evil`, newlines, and absolute URLs.
 */
export function isSafeAppRedirectPath(path: string): boolean {
    if (!path || path.length > 2048) return false;
    const p = path.trim();
    if (!p.startsWith('/')) return false;
    if (p.startsWith('//')) return false;
    if (p.includes('\\')) return false;
    if (/[\r\n\0]/.test(p)) return false;
    // Reject scheme-like paths browsers may mishandle
    if (/^\/[a-zA-Z][a-zA-Z+.-]*:/.test(p)) return false;
    return true;
}

export function getSafeAppRedirectPath(redirect: string | null, fallback = '/'): string {
    if (redirect == null || redirect === '') return fallback;
    return isSafeAppRedirectPath(redirect) ? redirect.trim() : fallback;
}
