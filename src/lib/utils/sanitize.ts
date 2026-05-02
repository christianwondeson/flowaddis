/**
 * HTML sanitization (client + server) using isomorphic-dompurify to avoid XSS when
 * rendering third-party HTML (e.g. hotel policies).
 */
import DOMPurify from 'isomorphic-dompurify';

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
} as const;

/**
 * Sanitizes HTML for safe rendering with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';
    return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/**
 * Strips all HTML tags (plain text only).
 */
export function stripHtml(html: string): string {
    if (!html) return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
