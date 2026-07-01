import { describe, it, expect } from 'vitest';
import {
    buildLocalCheckoutMetadata,
    etMsisdnToLocalDisplay,
    ET_MOBILE_PATTERN,
} from './local-payment-checkout';

describe('local-payment-checkout', () => {
    it('converts E.164 ET numbers to local 09 format', () => {
        expect(etMsisdnToLocalDisplay('+251912345678')).toBe('0912345678');
        expect(etMsisdnToLocalDisplay('251912345678')).toBe('0912345678');
        expect(etMsisdnToLocalDisplay('0912345678')).toBe('0912345678');
    });

    it('builds metadata with customerMsisdn and hotel dates', () => {
        const meta = buildLocalCheckoutMetadata({
            customerMsisdn: '0912345678',
            externalSnapshot: {
                checkIn: '2026-07-01',
                checkOut: '2026-07-03',
                roomBlockId: 'blk-1',
                roomBookQuantity: 1,
            },
        });
        expect(meta.customerMsisdn).toBe('0912345678');
        expect(meta.checkin).toBe('2026-07-01');
        expect(meta.checkout).toBe('2026-07-03');
        expect(meta.roomBlockId).toBe('blk-1');
    });

    it('validates Ethiopian mobile pattern', () => {
        expect(ET_MOBILE_PATTERN.test('0912345678')).toBe(true);
        expect(ET_MOBILE_PATTERN.test('0712345678')).toBe(true);
        expect(ET_MOBILE_PATTERN.test('912345678')).toBe(false);
    });
});
