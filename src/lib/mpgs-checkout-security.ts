/**
 * Client-side guards for MPGS Hosted Checkout.
 * Card data never touches BookAddis — only session IDs and script URLs are validated here.
 */

const DEFAULT_MPGS_GATEWAY_HOST = 'https://test-gateway.mastercard.com';

const ALLOWED_MPGS_GATEWAY_HOSTS = new Set([
    'test-gateway.mastercard.com',
    'gateway.mastercard.com',
    'ap-gateway.mastercard.com',
    'eu-gateway.mastercard.com',
    'na-gateway.mastercard.com',
]);

const MPGS_SESSION_ID_PATTERN = /^SESSION[A-Z0-9_-]{20,60}$/i;
const MPGS_RESULT_INDICATOR_PATTERN = /^[A-Za-z0-9]{16,32}$/;

export function resolveMpgsGatewayHost(): string {
    const raw =
        process.env.NEXT_PUBLIC_MPGS_GATEWAY_HOST?.trim() || DEFAULT_MPGS_GATEWAY_HOST;
    return raw.replace(/\/$/, '');
}

export function resolveMpgsCheckoutScriptUrl(): string {
    return `${resolveMpgsGatewayHost()}/static/checkout/checkout.min.js`;
}

function isAllowedMpgsGatewayHost(hostname: string): boolean {
    return ALLOWED_MPGS_GATEWAY_HOSTS.has(hostname.toLowerCase());
}

function isValidMpgsCheckoutScriptUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        if (!isAllowedMpgsGatewayHost(parsed.hostname)) return false;
        return parsed.pathname === '/static/checkout/checkout.min.js';
    } catch {
        return false;
    }
}

/** Prefer env-built URL; fall back to API value only if it passes allowlist. */
export function resolveTrustedMpgsCheckoutScriptUrl(apiUrl: string | undefined): string | null {
    const fromEnv = resolveMpgsCheckoutScriptUrl();
    if (isValidMpgsCheckoutScriptUrl(fromEnv)) return fromEnv;
    if (apiUrl && isValidMpgsCheckoutScriptUrl(apiUrl)) return apiUrl;
    return null;
}

export function isValidMpgsSessionId(sessionId: string): boolean {
    return MPGS_SESSION_ID_PATTERN.test(sessionId.trim());
}

export function isValidMpgsResultIndicator(value: string): boolean {
    return MPGS_RESULT_INDICATOR_PATTERN.test(value.trim());
}
