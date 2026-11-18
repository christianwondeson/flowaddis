import { publicizeCmsMediaUrl } from '@/lib/cms-media-url';

/**
 * Server-side absolute Strapi media URL (for Nest media.photos).
 * Localhost origins are rewritten to the public CMS in production.
 */
export function resolveStrapiFileUrlServer(path?: string | null): string | null {
    if (!path) return null;
    const resolved = publicizeCmsMediaUrl(path);
    return resolved || null;
}
