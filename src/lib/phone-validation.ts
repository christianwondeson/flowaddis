/**
 * Comprehensive phone and email validation for BookAddis booking flows.
 * Supports international country dial codes, format normalization,
 * and carrier validation for Ethiopia (+251 9 for Ethio Telecom, +251 7 for Safaricom).
 */

export interface CountryPhoneConfig {
    code: string;
    name: string;
    dial: string;
    flag: string;
    min: number;
    max: number;
    placeholder: string;
    pattern?: RegExp;
    carrierValidator?: (nationalNumber: string) => {
        valid: boolean;
        carrier?: string;
        error?: string;
    };
}

export const COUNTRY_PHONE_CONFIGS: CountryPhoneConfig[] = [
    {
        code: 'ET',
        name: 'Ethiopia',
        dial: '+251',
        flag: '🇪🇹',
        min: 9,
        max: 9,
        placeholder: '91 123 4567 or 091 123 4567',
        carrierValidator: (national) => {
            // Strip leading zero if present (e.g. 0911234567 -> 911234567)
            const clean = national.replace(/^0+/, '');
            if (clean.length !== 9) {
                return {
                    valid: false,
                    error: 'Ethiopian mobile number must be 9 digits (e.g. 91 123 4567)',
                };
            }
            if (clean.startsWith('9')) {
                return { valid: true, carrier: 'Ethio telecom' };
            }
            if (clean.startsWith('7')) {
                return { valid: true, carrier: 'Safaricom' };
            }
            return {
                valid: false,
                error: 'Ethiopian mobile must start with 9 (Ethio telecom) or 7 (Safaricom)',
            };
        },
    },
    {
        code: 'US',
        name: 'United States',
        dial: '+1',
        flag: '🇺🇸',
        min: 10,
        max: 10,
        placeholder: '202 555 0199',
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        dial: '+44',
        flag: '🇬🇧',
        min: 10,
        max: 10,
        placeholder: '7911 123456',
    },
    {
        code: 'CA',
        name: 'Canada',
        dial: '+1',
        flag: '🇨🇦',
        min: 10,
        max: 10,
        placeholder: '416 555 0199',
    },
    {
        code: 'KE',
        name: 'Kenya',
        dial: '+254',
        flag: '🇰🇪',
        min: 9,
        max: 9,
        placeholder: '712 345 678',
    },
    {
        code: 'AE',
        name: 'United Arab Emirates',
        dial: '+971',
        flag: '🇦🇪',
        min: 9,
        max: 9,
        placeholder: '50 123 4567',
    },
    {
        code: 'SA',
        name: 'Saudi Arabia',
        dial: '+966',
        flag: '🇸🇦',
        min: 9,
        max: 9,
        placeholder: '50 123 4567',
    },
    {
        code: 'DE',
        name: 'Germany',
        dial: '+49',
        flag: '🇩🇪',
        min: 10,
        max: 11,
        placeholder: '151 23456789',
    },
    {
        code: 'FR',
        name: 'France',
        dial: '+33',
        flag: '🇫🇷',
        min: 9,
        max: 9,
        placeholder: '6 12 34 56 78',
    },
    {
        code: 'IT',
        name: 'Italy',
        dial: '+39',
        flag: '🇮🇹',
        min: 10,
        max: 10,
        placeholder: '312 345 6789',
    },
    {
        code: 'TR',
        name: 'Turkey',
        dial: '+90',
        flag: '🇹🇷',
        min: 10,
        max: 10,
        placeholder: '512 345 6789',
    },
    {
        code: 'DJ',
        name: 'Djibouti',
        dial: '+253',
        flag: '🇩🇯',
        min: 8,
        max: 8,
        placeholder: '77 12 34 56',
    },
    {
        code: 'SO',
        name: 'Somalia',
        dial: '+252',
        flag: '🇸🇴',
        min: 8,
        max: 9,
        placeholder: '61 123 4567',
    },
    {
        code: 'SD',
        name: 'Sudan',
        dial: '+249',
        flag: '🇸🇩',
        min: 9,
        max: 9,
        placeholder: '91 234 5678',
    },
    {
        code: 'SS',
        name: 'South Sudan',
        dial: '+211',
        flag: '🇸🇸',
        min: 9,
        max: 9,
        placeholder: '91 234 5678',
    },
    {
        code: 'UG',
        name: 'Uganda',
        dial: '+256',
        flag: '🇺🇬',
        min: 9,
        max: 9,
        placeholder: '71 234 5678',
    },
    {
        code: 'RW',
        name: 'Rwanda',
        dial: '+250',
        flag: '🇷🇼',
        min: 9,
        max: 9,
        placeholder: '78 123 4567',
    },
    {
        code: 'TZ',
        name: 'Tanzania',
        dial: '+255',
        flag: '🇹🇿',
        min: 9,
        max: 9,
        placeholder: '71 234 5678',
    },
    {
        code: 'NG',
        name: 'Nigeria',
        dial: '+234',
        flag: '🇳🇬',
        min: 10,
        max: 10,
        placeholder: '802 123 4567',
    },
    {
        code: 'ZA',
        name: 'South Africa',
        dial: '+27',
        flag: '🇿🇦',
        min: 9,
        max: 9,
        placeholder: '71 234 5678',
    },
    {
        code: 'EG',
        name: 'Egypt',
        dial: '+20',
        flag: '🇪🇬',
        min: 10,
        max: 10,
        placeholder: '10 1234 5678',
    },
    {
        code: 'IN',
        name: 'India',
        dial: '+91',
        flag: '🇮🇳',
        min: 10,
        max: 10,
        placeholder: '98765 43210',
    },
    {
        code: 'CN',
        name: 'China',
        dial: '+86',
        flag: '🇨🇳',
        min: 11,
        max: 11,
        placeholder: '138 0013 8000',
    },
    {
        code: 'AU',
        name: 'Australia',
        dial: '+61',
        flag: '🇦🇺',
        min: 9,
        max: 9,
        placeholder: '412 345 678',
    },
    {
        code: 'QA',
        name: 'Qatar',
        dial: '+974',
        flag: '🇶🇦',
        min: 8,
        max: 8,
        placeholder: '3312 3456',
    },
    {
        code: 'NL',
        name: 'Netherlands',
        dial: '+31',
        flag: '🇳🇱',
        min: 9,
        max: 9,
        placeholder: '6 12345678',
    },
    {
        code: 'CH',
        name: 'Switzerland',
        dial: '+41',
        flag: '🇨🇭',
        min: 9,
        max: 9,
        placeholder: '78 123 45 67',
    },
    {
        code: 'SE',
        name: 'Sweden',
        dial: '+46',
        flag: '🇸🇪',
        min: 9,
        max: 9,
        placeholder: '70 123 45 67',
    },
    {
        code: 'BE',
        name: 'Belgium',
        dial: '+32',
        flag: '🇧🇪',
        min: 9,
        max: 9,
        placeholder: '470 12 34 56',
    },
    {
        code: 'NO',
        name: 'Norway',
        dial: '+47',
        flag: '🇳🇴',
        min: 8,
        max: 8,
        placeholder: '412 34 567',
    },
    {
        code: 'IL',
        name: 'Israel',
        dial: '+972',
        flag: '🇮🇱',
        min: 9,
        max: 9,
        placeholder: '50 123 4567',
    },
    {
        code: 'JP',
        name: 'Japan',
        dial: '+81',
        flag: '🇯🇵',
        min: 10,
        max: 10,
        placeholder: '90 1234 5678',
    },
    {
        code: 'BR',
        name: 'Brazil',
        dial: '+55',
        flag: '🇧🇷',
        min: 11,
        max: 11,
        placeholder: '11 91234 5678',
    },
];

export const DEFAULT_COUNTRY = COUNTRY_PHONE_CONFIGS[0]; // Ethiopia

export function getCountryConfig(code: string): CountryPhoneConfig {
    const found = COUNTRY_PHONE_CONFIGS.find(
        (c) => c.code.toUpperCase() === code.toUpperCase(),
    );
    return found || DEFAULT_COUNTRY;
}

/**
 * Validates an email address with standard RFC pattern and domain requirements.
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
    const trimmed = email.trim();
    if (!trimmed) {
        return { isValid: false, error: 'Email address is required' };
    }
    // Check general syntax
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com)' };
    }
    const parts = trimmed.split('@');
    if (parts.length !== 2 || !parts[1].includes('.')) {
        return { isValid: false, error: 'Email must contain a valid domain (e.g. example.com)' };
    }
    const tld = parts[1].split('.').pop();
    if (!tld || tld.length < 2) {
        return { isValid: false, error: 'Email domain extension must be at least 2 letters' };
    }
    return { isValid: true };
}

export interface PhoneValidationResult {
    isValid: boolean;
    normalizedE164: string;
    nationalDigits: string;
    carrier?: string;
    error?: string;
}

/**
 * Validates a phone number against country specifications and carrier rules.
 * Handles both national input with separate dial code and full E.164 strings.
 */
export function validatePhoneNumber(
    input: string,
    countryCode = 'ET',
): PhoneValidationResult {
    const config = getCountryConfig(countryCode);
    const raw = input.trim();

    if (!raw) {
        return {
            isValid: false,
            normalizedE164: '',
            nationalDigits: '',
            error: 'Phone number is required',
        };
    }

    // Extract digits only
    let digits = raw.replace(/\D/g, '');

    // If input starts with dial code digits, strip dial code prefix to get national number
    const dialDigits = config.dial.replace(/\D/g, '');
    if (digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
        digits = digits.slice(dialDigits.length);
    }

    // Specific carrier and pattern validation
    if (config.carrierValidator) {
        const carrierCheck = config.carrierValidator(digits);
        if (!carrierCheck.valid) {
            return {
                isValid: false,
                normalizedE164: `${config.dial}${digits.replace(/^0+/, '')}`,
                nationalDigits: digits,
                error: carrierCheck.error,
            };
        }
        const cleanNational = digits.replace(/^0+/, '');
        return {
            isValid: true,
            normalizedE164: `${config.dial}${cleanNational}`,
            nationalDigits: cleanNational,
            carrier: carrierCheck.carrier,
        };
    }

    // Standard length range validation for other countries
    // Remove leading zero if entered in national format
    const nationalClean = digits.replace(/^0+/, '');
    if (nationalClean.length < config.min || nationalClean.length > config.max) {
        const errorMsg =
            config.min === config.max
                ? `${config.name} phone number must be ${config.min} digits`
                : `${config.name} phone number must be between ${config.min} and ${config.max} digits`;
        return {
            isValid: false,
            normalizedE164: `${config.dial}${nationalClean}`,
            nationalDigits: nationalClean,
            error: errorMsg,
        };
    }

    return {
        isValid: true,
        normalizedE164: `${config.dial}${nationalClean}`,
        nationalDigits: nationalClean,
    };
}

/**
 * Normalizes any Ethiopian phone number representation (E.164 +251..., 251..., 9..., 09..., 07...)
 * into standard 10-digit national format (e.g. "0912345678" or "0712345678") for USSD payment rails.
 * Returns empty string if input is null/undefined, or extracted digits.
 */
export function toLocalEthiopianPhone(phone?: string | null): string {
    if (!phone) return '';
    const cleaned = String(phone).trim();
    const digits = cleaned.replace(/\D/g, '');
    if (digits.startsWith('251') && digits.length === 12) {
        return '0' + digits.slice(3);
    }
    if ((digits.startsWith('9') || digits.startsWith('7')) && digits.length === 9) {
        return '0' + digits;
    }
    if ((digits.startsWith('09') || digits.startsWith('07')) && digits.length === 10) {
        return digits;
    }
    return digits;
}

