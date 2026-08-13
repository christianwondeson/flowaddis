import type { HotelPartnerKyc, HotelPartnerStatus, User } from '@/types/auth';

/** Firestore rejects `undefined` field values — drop them before write. */
export function omitUndefinedDeep<T>(value: T): T {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
        return value.map((item) => omitUndefinedDeep(item)) as T;
    }
    // Keep FieldValue / Timestamp / Date / class instances intact (do not clone).
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
        return value;
    }
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (child === undefined) continue;
        out[key] = omitUndefinedDeep(child);
    }
    return out as T;
}

/** Ethiopian TIN is typically 10 digits (spaces/dashes ignored). */
export function normalizeTin(raw: string): string {
    return raw.replace(/[\s\-]/g, '').trim();
}

export function isValidTin(raw: string): boolean {
    const tin = normalizeTin(raw);
    return /^\d{10}$/.test(tin);
}

/** Accept +251… or local 09… / 07… style numbers (8–15 digits after cleanup). */
export function normalizePhone(raw: string): string {
    return raw.replace(/[^\d+]/g, '').trim();
}

export function isValidEtPhone(raw: string): boolean {
    const phone = normalizePhone(raw);
    if (/^\+251\d{9}$/.test(phone)) return true;
    if (/^0[79]\d{8}$/.test(phone)) return true;
    if (/^251\d{9}$/.test(phone)) return true;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15;
}

/** CBE / bank account: 8–16 digits. */
export function normalizeAccountDigits(raw: string): string {
    return raw.replace(/\D/g, '');
}

export function isValidBankAccount(raw: string): boolean {
    const digits = normalizeAccountDigits(raw);
    return digits.length >= 8 && digits.length <= 16;
}

export type HotelPropertyValidation = {
    ok: boolean;
    message?: string;
    tin?: string;
    phone?: string;
};

export function validateHotelPropertyFields(input: {
    legalBusinessName: string;
    hotelName: string;
    tin: string;
    regNumber: string;
    city: string;
    phone: string;
    businessAddress?: string;
    roomCount?: string;
}): HotelPropertyValidation {
    if (!input.legalBusinessName.trim()) {
        return { ok: false, message: 'Legal business name is required' };
    }
    if (input.legalBusinessName.trim().length < 2) {
        return { ok: false, message: 'Legal business name looks too short' };
    }
    if (!input.hotelName.trim()) {
        return { ok: false, message: 'Hotel / trade name is required' };
    }
    if (!isValidTin(input.tin)) {
        return {
            ok: false,
            message: 'Enter a valid 10-digit TIN (numbers only)',
        };
    }
    if (!input.regNumber.trim() || input.regNumber.trim().length < 3) {
        return {
            ok: false,
            message: 'Business registration number is required',
        };
    }
    if (!input.city.trim()) {
        return { ok: false, message: 'City is required' };
    }
    if (!input.phone.trim() || !isValidEtPhone(input.phone)) {
        return {
            ok: false,
            message: 'Enter a valid phone (e.g. +2519… or 09…)',
        };
    }
    if (input.businessAddress !== undefined && !input.businessAddress.trim()) {
        return { ok: false, message: 'Business address is required' };
    }
    if (input.roomCount !== undefined) {
        const n = Number(input.roomCount);
        if (!Number.isFinite(n) || n < 1) {
            return { ok: false, message: 'Declared room count must be at least 1' };
        }
    }
    return {
        ok: true,
        tin: normalizeTin(input.tin),
        phone: normalizePhone(input.phone),
    };
}

export type HotelPayoutValidation = {
    ok: boolean;
    message?: string;
    cbeAccount?: string;
    accountNumber?: string;
};

export function validateHotelPayoutFields(input: {
    accountName: string;
    cbeAccount: string;
    bankName: string;
    accountNumber?: string;
}): HotelPayoutValidation {
    if (!input.accountName.trim() || input.accountName.trim().length < 2) {
        return { ok: false, message: 'Payout account name is required' };
    }
    if (!isValidBankAccount(input.cbeAccount)) {
        return {
            ok: false,
            message: 'CBE account must be 8–16 digits',
        };
    }
    if (!input.bankName.trim()) {
        return { ok: false, message: 'Bank name is required' };
    }
    const optionalAccount = input.accountNumber?.trim() || '';
    if (optionalAccount && !isValidBankAccount(optionalAccount)) {
        return {
            ok: false,
            message: 'Other account number must be 8–16 digits when provided',
        };
    }
    return {
        ok: true,
        cbeAccount: normalizeAccountDigits(input.cbeAccount),
        accountNumber: optionalAccount
            ? normalizeAccountDigits(optionalAccount)
            : undefined,
    };
}

/** All required KYC files + legal identity for Super Admin review. */
export function isKycPackageComplete(kyc?: HotelPartnerKyc | null): boolean {
    if (!kyc) return false;
    return Boolean(
        kyc.legalBusinessName?.trim() &&
            kyc.tin?.trim() &&
            kyc.businessRegistrationNumber?.trim() &&
            kyc.logoUrl &&
            kyc.businessLicenseUrl &&
            kyc.taxCertificateUrl &&
            kyc.ownerIdUrl,
    );
}

export function kycMissingLabels(kyc?: HotelPartnerKyc | null): string[] {
    const missing: string[] = [];
    if (!kyc?.legalBusinessName?.trim()) missing.push('Legal business name');
    if (!kyc?.tin?.trim()) missing.push('TIN');
    if (!kyc?.businessRegistrationNumber?.trim()) {
        missing.push('Business registration number');
    }
    if (!kyc?.logoUrl) missing.push('Logo');
    if (!kyc?.businessLicenseUrl) missing.push('Business license');
    if (!kyc?.taxCertificateUrl) missing.push('Tax certificate');
    if (!kyc?.ownerIdUrl) missing.push('Owner / authorized person ID');
    return missing;
}

/** Partner waiting for Super Admin  not portal-eligible. */
export function isHotelPartnerAwaitingApproval(
    status?: HotelPartnerStatus | null,
): boolean {
    return status === 'draft' || status === 'pending';
}

/**
 * Hotel extranet only after Super Admin approval + operator role.
 * Legacy operators without hotelPartnerStatus still allowed.
 */
export function isHotelPortalUnlocked(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role !== 'hotel_admin' && user.role !== 'hotel_staff') return false;
    const s = user.hotelPartnerStatus;
    if (s === 'pending' || s === 'draft' || s === 'rejected') return false;
    return true;
}
