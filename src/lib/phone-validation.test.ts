import { describe, it, expect } from 'vitest';
import {
    validatePhoneNumber,
    validateEmail,
    getCountryConfig,
} from './phone-validation';

describe('Phone and Email Validation', () => {
    describe('Ethiopian Carrier Validation', () => {
        it('validates Ethio telecom numbers (+251 9... and 09...)', () => {
            const res1 = validatePhoneNumber('911223344', 'ET');
            expect(res1.isValid).toBe(true);
            expect(res1.carrier).toBe('Ethio telecom');
            expect(res1.normalizedE164).toBe('+251911223344');

            const res2 = validatePhoneNumber('0911223344', 'ET');
            expect(res2.isValid).toBe(true);
            expect(res2.carrier).toBe('Ethio telecom');
            expect(res2.normalizedE164).toBe('+251911223344');

            const res3 = validatePhoneNumber('+251911223344', 'ET');
            expect(res3.isValid).toBe(true);
            expect(res3.carrier).toBe('Ethio telecom');
        });

        it('validates Safaricom Ethiopia numbers (+251 7... and 07...)', () => {
            const res1 = validatePhoneNumber('711223344', 'ET');
            expect(res1.isValid).toBe(true);
            expect(res1.carrier).toBe('Safaricom');
            expect(res1.normalizedE164).toBe('+251711223344');

            const res2 = validatePhoneNumber('0711223344', 'ET');
            expect(res2.isValid).toBe(true);
            expect(res2.carrier).toBe('Safaricom');
            expect(res2.normalizedE164).toBe('+251711223344');

            const res3 = validatePhoneNumber('+251711223344', 'ET');
            expect(res3.isValid).toBe(true);
            expect(res3.carrier).toBe('Safaricom');
        });

        it('rejects invalid prefixes for Ethiopia (neither 9 nor 7)', () => {
            const res = validatePhoneNumber('211223344', 'ET');
            expect(res.isValid).toBe(false);
            expect(res.error).toContain('Ethio telecom');
            expect(res.error).toContain('Safaricom');
        });

        it('rejects invalid length for Ethiopia', () => {
            const resShort = validatePhoneNumber('91122', 'ET');
            expect(resShort.isValid).toBe(false);
            expect(resShort.error).toContain('9 digits');

            const resLong = validatePhoneNumber('9112233445566', 'ET');
            expect(resLong.isValid).toBe(false);
            expect(resLong.error).toContain('9 digits');
        });
    });

    describe('International Phone Validation', () => {
        it('validates US 10-digit numbers', () => {
            const res = validatePhoneNumber('2025550199', 'US');
            expect(res.isValid).toBe(true);
            expect(res.normalizedE164).toBe('+12025550199');
        });

        it('rejects invalid length for US', () => {
            const res = validatePhoneNumber('20255', 'US');
            expect(res.isValid).toBe(false);
            expect(res.error).toContain('10 digits');
        });

        it('falls back to default country if unknown code provided', () => {
            const config = getCountryConfig('XYZ');
            expect(config.code).toBe('ET');
        });
    });

    describe('Email Validation', () => {
        it('accepts valid email formats', () => {
            expect(validateEmail('user@example.com').isValid).toBe(true);
            expect(validateEmail('test.name+tag@bookaddis.com').isValid).toBe(true);
        });

        it('rejects invalid email formats', () => {
            expect(validateEmail('').isValid).toBe(false);
            expect(validateEmail('user@').isValid).toBe(false);
            expect(validateEmail('user@domain').isValid).toBe(false);
            expect(validateEmail('user@domain.c').isValid).toBe(false);
            expect(validateEmail('not-an-email').isValid).toBe(false);
        });
    });
});
