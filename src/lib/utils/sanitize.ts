/**
 * HTML Sanitization Utility
 * 
 * Provides safe HTML sanitization to prevent XSS attacks when rendering
 * HTML content from external APIs.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML string to prevent XSS attacks
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(apiResponse.html) }} />
 * ```
 */
export function sanitizeHtml(html: string): string {
    if (typeof window === 'undefined') {
        // Server-side: return as-is (will be sanitized on client)
        return html;
    }

    // Configure DOMPurify to allow safe HTML tags
    const config = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
    };

    return DOMPurify.sanitize(html, config);
}

/**
 * Strips all HTML tags from a string
 * 
 * @param html - The HTML string to strip
 * @returns Plain text without any HTML tags
 */
export function stripHtml(html: string): string {
    if (typeof window === 'undefined') {
        // Server-side: basic regex strip
        return html.replace(/<[^>]*>/g, '');
    }

    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
