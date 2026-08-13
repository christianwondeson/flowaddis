/**
 * Server-side absolute Strapi media URL (for Nest media.photos).
 */
export function resolveStrapiFileUrlServer(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = (
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        process.env.STRAPI_URL ||
        ''
    )
        .trim()
        .replace(/\/$/, '');
    if (!base) {
        return path.startsWith('/') ? path : `/${path}`;
    }
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
