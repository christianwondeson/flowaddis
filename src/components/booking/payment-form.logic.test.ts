import { describe, it, expect, vi, afterEach } from 'vitest';

// payment-form.tsx pulls in browser/SDK singletons at import time; stub the heavy
// ones so we can unit-test the exported location logic in isolation.
vi.mock('@/lib/firebase', () => ({ auth: {} }));
vi.mock('@/lib/stripe', () => ({ getStripe: () => null }));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { detectEthiopianVisitor } from './payment-form';

function setBrowserTimezone(tz: string) {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
        () => ({ resolvedOptions: () => ({ timeZone: tz }) }) as unknown as Intl.DateTimeFormat,
    );
}

describe('detectEthiopianVisitor (location flexibility)', () => {
    afterEach(() => vi.restoreAllMocks());

    it('treats Amharic locale as Ethiopian regardless of timezone', () => {
        setBrowserTimezone('Europe/London');
        expect(detectEthiopianVisitor('am')).toBe(true);
    });

    it('treats an Addis Ababa timezone as Ethiopian', () => {
        setBrowserTimezone('Africa/Addis_Ababa');
        expect(detectEthiopianVisitor('en')).toBe(true);
    });

    it('treats a visitor in Kenya (Nairobi tz, non-Amharic) as non-Ethiopian', () => {
        setBrowserTimezone('Africa/Nairobi');
        expect(detectEthiopianVisitor('en')).toBe(false);
    });

    it('fails safe to non-Ethiopian when the timezone cannot be resolved', () => {
        vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
            throw new Error('no Intl');
        });
        expect(detectEthiopianVisitor('en')).toBe(false);
    });
});
