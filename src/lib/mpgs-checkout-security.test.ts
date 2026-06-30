import { describe, it, expect, afterEach } from 'vitest';
import {
    resolveMpgsGatewayHost,
    resolveMpgsCheckoutScriptUrl,
    resolveTrustedMpgsCheckoutScriptUrl,
    isValidMpgsSessionId,
    isValidMpgsResultIndicator,
} from './mpgs-checkout-security';

const ENV_KEY = 'NEXT_PUBLIC_MPGS_GATEWAY_HOST';

describe('mpgs-checkout-security', () => {
    afterEach(() => {
        delete process.env[ENV_KEY];
    });

    describe('host / script url resolution', () => {
        it('defaults to the Mastercard test gateway', () => {
            expect(resolveMpgsGatewayHost()).toBe('https://test-gateway.mastercard.com');
            expect(resolveMpgsCheckoutScriptUrl()).toBe(
                'https://test-gateway.mastercard.com/static/checkout/checkout.min.js',
            );
        });

        it('honours the env override and strips a trailing slash', () => {
            process.env[ENV_KEY] = 'https://gateway.mastercard.com/';
            expect(resolveMpgsGatewayHost()).toBe('https://gateway.mastercard.com');
        });
    });

    describe('resolveTrustedMpgsCheckoutScriptUrl', () => {
        it('uses the env-derived URL when it is on the allowlist', () => {
            process.env[ENV_KEY] = 'https://gateway.mastercard.com';
            expect(resolveTrustedMpgsCheckoutScriptUrl(undefined)).toBe(
                'https://gateway.mastercard.com/static/checkout/checkout.min.js',
            );
        });

        it('falls back to a valid API URL when env host is not allowlisted', () => {
            process.env[ENV_KEY] = 'https://evil.example';
            const apiUrl = 'https://eu-gateway.mastercard.com/static/checkout/checkout.min.js';
            expect(resolveTrustedMpgsCheckoutScriptUrl(apiUrl)).toBe(apiUrl);
        });

        it('rejects an untrusted API URL (wrong host / path / protocol)', () => {
            process.env[ENV_KEY] = 'https://evil.example';
            expect(
                resolveTrustedMpgsCheckoutScriptUrl('https://evil.example/static/checkout/checkout.min.js'),
            ).toBeNull();
            expect(
                resolveTrustedMpgsCheckoutScriptUrl('https://gateway.mastercard.com/malware.js'),
            ).toBeNull();
            expect(
                resolveTrustedMpgsCheckoutScriptUrl('http://gateway.mastercard.com/static/checkout/checkout.min.js'),
            ).toBeNull();
        });
    });

    describe('session id / result indicator validation', () => {
        it('accepts well-formed values', () => {
            expect(isValidMpgsSessionId('SESSION0002831234567890123456')).toBe(true);
            expect(isValidMpgsResultIndicator('abc123DEF4567890')).toBe(true);
        });
        it('rejects malformed values', () => {
            expect(isValidMpgsSessionId('not-a-session')).toBe(false);
            expect(isValidMpgsSessionId('SESSION-short')).toBe(false);
            expect(isValidMpgsResultIndicator('short')).toBe(false);
            expect(isValidMpgsResultIndicator('has spaces and symbols!!')).toBe(false);
        });
    });
});
