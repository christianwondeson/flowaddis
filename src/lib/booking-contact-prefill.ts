/**
 * Prefill booking contact fields from signed-in user profile (E.164 phone).
 */

export type ParsedPhone = {
    countryCode: string;
    nationalNumber: string;
    e164: string;
};

const DIAL_TO_COUNTRY: Record<string, string> = {
    '+251': 'ET',
    '+1': 'US',
    '+44': 'GB',
    '+971': 'AE',
    '+49': 'DE',
    '+90': 'TR',
    '+966': 'SA',
    '+254': 'KE',
    '+234': 'NG',
    '+27': 'ZA',
    '+33': 'FR',
    '+91': 'IN',
    '+86': 'CN',
};

/** Map E.164 (+251911234567) to country picker state. Defaults to ET when unknown. */
export function parseE164Phone(e164: string): ParsedPhone | null {
    const trimmed = e164.trim();
    if (!trimmed.startsWith('+')) return null;
    const digits = trimmed.slice(1).replace(/\D/g, '');
    if (digits.length < 8) return null;

    const dialCandidates = Object.keys(DIAL_TO_COUNTRY).sort((a, b) => b.length - a.length);
    for (const dial of dialCandidates) {
        const dialDigits = dial.slice(1);
        if (digits.startsWith(dialDigits)) {
            const nationalNumber = digits.slice(dialDigits.length);
            if (!nationalNumber) return null;
            return {
                countryCode: DIAL_TO_COUNTRY[dial] ?? 'ET',
                nationalNumber,
                e164: `+${digits}`,
            };
        }
    }

    return {
        countryCode: 'ET',
        nationalNumber: digits,
        e164: `+${digits}`,
    };
}

/** Prefer profile phone, then booking-form phone. */
export function resolveCheckoutPhone(profilePhone?: string, formPhone?: string): string {
    const profile = profilePhone?.trim();
    if (profile) return profile;
    return formPhone?.trim() ?? '';
}
