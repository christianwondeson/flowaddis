import { describe, it, expect } from 'vitest';
import { pickNestCreateSessionBody, NEST_CREATE_SESSION_KEYS } from './nest-checkout-body';

describe('pickNestCreateSessionBody', () => {
    it('keeps only whitelisted keys', () => {
        const out = pickNestCreateSessionBody({
            bookingType: 'hotel',
            source: 'web',
            externalItemId: 'h1',
            currency: 'USD',
            metadata: { checkin: '2026-01-01' },
            external_snapshot: { serviceName: 'Hotel' },
            paymentChannel: 'mpgs',
        });
        expect(Object.keys(out).sort()).toEqual([...NEST_CREATE_SESSION_KEYS].sort());
    });

    it('strips client-controlled fields like price and returnUrl (anti-tamper)', () => {
        const out = pickNestCreateSessionBody({
            bookingType: 'hotel',
            amount: 1, // attacker-supplied price
            price: 1,
            returnUrl: 'https://evil.example',
            firebase_uid: 'spoofed',
        });
        expect(out).toEqual({ bookingType: 'hotel' });
        expect(out).not.toHaveProperty('amount');
        expect(out).not.toHaveProperty('returnUrl');
    });

    it('drops null/undefined values', () => {
        const out = pickNestCreateSessionBody({ bookingType: 'hotel', source: null, currency: undefined });
        expect(out).toEqual({ bookingType: 'hotel' });
    });

    it('returns an empty object for non-object input', () => {
        expect(pickNestCreateSessionBody(null)).toEqual({});
        expect(pickNestCreateSessionBody('x')).toEqual({});
        expect(pickNestCreateSessionBody([1, 2])).toEqual({});
    });
});
