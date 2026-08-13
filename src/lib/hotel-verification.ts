/**
 * Property-level verification package (Booking.com / Agoda style).
 * Stored on Nest hotel.media.verification  not only on the Firebase user KYC.
 */

export type HotelVerification = {
    legalBusinessName?: string;
    tradeName?: string;
    businessRegistrationNumber?: string;
    tin?: string;
    businessAddress?: string;
    city?: string;
    country?: string;
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    ownershipRole?: string;
    declaredRoomCount?: number;
    logoUrl?: string;
    /** Required before publish to BookAddis search */
    businessLicenseUrl?: string;
    taxCertificateUrl?: string;
    ownerIdUrl?: string;
    /** ISO timestamp when Super Admin last confirmed docs */
    verifiedAt?: string | null;
    verifiedByUid?: string | null;
    notes?: string;
};

export function getHotelVerification(
    media: Record<string, unknown> | null | undefined,
): HotelVerification {
    if (!media || typeof media !== 'object') return {};
    const raw = media.verification;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw as HotelVerification;
}

export function withHotelVerification(
    media: Record<string, unknown> | null | undefined,
    verification: HotelVerification,
): Record<string, unknown> {
    const base = { ...(media || {}) };
    base.verification = { ...verification };
    return base;
}

/** Minimum docs for a hotel to go live on BookAddis (OTA-style). */
export function hotelVerificationReady(v: HotelVerification | null | undefined): {
    ok: boolean;
    missing: string[];
} {
    const missing: string[] = [];
    if (!v?.legalBusinessName?.trim()) missing.push('Legal business name');
    if (!v?.tin?.trim()) missing.push('TIN');
    if (!v?.businessRegistrationNumber?.trim()) {
        missing.push('Business registration number');
    }
    if (!v?.businessLicenseUrl) missing.push('Business license');
    if (!v?.taxCertificateUrl) missing.push('Tax certificate');
    if (!v?.ownerIdUrl) missing.push('Owner / authorized ID');
    return { ok: missing.length === 0, missing };
}

export function verificationFromPartnerKyc(
    kyc: {
        legalBusinessName?: string;
        tradeName?: string;
        businessRegistrationNumber?: string;
        tin?: string;
        businessAddress?: string;
        city?: string;
        country?: string;
        contactPhone?: string;
        contactEmail?: string;
        website?: string;
        ownershipRole?: string;
        declaredRoomCount?: number;
        logoUrl?: string;
        businessLicenseUrl?: string;
        taxCertificateUrl?: string;
        ownerIdUrl?: string;
    } | null | undefined,
): HotelVerification {
    if (!kyc) return {};
    return {
        legalBusinessName: kyc.legalBusinessName,
        tradeName: kyc.tradeName,
        businessRegistrationNumber: kyc.businessRegistrationNumber,
        tin: kyc.tin,
        businessAddress: kyc.businessAddress,
        city: kyc.city,
        country: kyc.country || 'ET',
        contactPhone: kyc.contactPhone,
        contactEmail: kyc.contactEmail,
        website: kyc.website,
        ownershipRole: kyc.ownershipRole,
        declaredRoomCount: kyc.declaredRoomCount,
        logoUrl: kyc.logoUrl,
        businessLicenseUrl: kyc.businessLicenseUrl,
        taxCertificateUrl: kyc.taxCertificateUrl,
        ownerIdUrl: kyc.ownerIdUrl,
    };
}
