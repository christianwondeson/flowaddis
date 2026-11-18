/**
 * Normalize CMS / Strapi media URLs for the current environment.
 * Local uploads often get stored as http://127.0.0.1:1337/... — those break on
 * bookaddis.com (CSP https-only + Cloud Run cannot reach localhost).
 */
const LOCAL_CMS_ORIGIN = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i;

export const PRODUCTION_CMS_URL = 'https://cms-prod.bookaddis.com';

/** True when we must not serve localhost CMS URLs to clients / image optimizer. */
export function shouldPublicizeCmsUrls(): boolean {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        return host !== 'localhost' && host !== '127.0.0.1';
    }
    return (
        process.env.NODE_ENV === 'production' ||
        Boolean(
            process.env.K_SERVICE ||
                process.env.FUNCTION_TARGET ||
                process.env.GCLOUD_PROJECT ||
                process.env.GOOGLE_CLOUD_PROJECT,
        )
    );
}

/**
 * Preferred public CMS origin. Never returns localhost when publicizing for prod.
 */
export function getPublicCmsBase(): string {
    const raw = (
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        process.env.STRAPI_URL ||
        ''
    )
        .trim()
        .replace(/\/$/, '');

    if (!raw || LOCAL_CMS_ORIGIN.test(raw)) {
        return PRODUCTION_CMS_URL;
    }
    return raw;
}

/**
 * Rewrite absolute localhost Strapi URLs (and relative /uploads) to the public CMS.
 * On local browser/dev server, leaves localhost URLs alone.
 */
export function publicizeCmsMediaUrl(url?: string | null): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    const publicize = shouldPublicizeCmsUrls();
    const cmsBase = getPublicCmsBase();

    if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads/')) {
        const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return publicize || !LOCAL_CMS_ORIGIN.test(cmsBase)
            ? `${cmsBase}${path}`
            : `${(process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337').replace(/\/$/, '')}${path}`;
    }

    if (!LOCAL_CMS_ORIGIN.test(trimmed)) {
        return trimmed;
    }

    if (!publicize) {
        return trimmed;
    }

    try {
        const u = new URL(trimmed);
        return `${cmsBase}${u.pathname}${u.search}`;
    } catch {
        return trimmed.replace(LOCAL_CMS_ORIGIN, cmsBase);
    }
}
