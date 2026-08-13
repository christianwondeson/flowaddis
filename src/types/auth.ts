import type { MultiFactorResolver, RecaptchaVerifier } from 'firebase/auth';

/** Firestore `users/{uid}.role`  `admin` is platform Super Admin. */
export type UserRole = 'admin' | 'hotel_admin' | 'hotel_staff' | 'user';

/** User-submitted request to become a hotel partner (Super Admin must approve). */
export type HotelPartnerStatus =
    | 'none'
    /** Account created; KYC / plan wizard not finished yet. */
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected';

/** KYC / business docs for hotel partner onboarding (Firestore + Storage URLs). */
export interface HotelPartnerKyc {
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
    /** Public logo URL (Strapi / Storage) */
    logoUrl?: string;
    /** Business license scan URL */
    businessLicenseUrl?: string;
    /** Tax certificate / TIN certificate URL */
    taxCertificateUrl?: string;
    /** ID of authorized signatory */
    ownerIdUrl?: string;
    ownershipRole?: string;
    declaredRoomCount?: number;
    /** Draft payout details  copied to Nest payout profile after hotel is created. */
    payoutDraft?: {
        accountName?: string;
        cbeAccount?: string;
        bankName?: string;
        accountNumber?: string;
    };
    /** Partner acknowledged SaaS subscription is paid separately after approval. */
    acknowledgedSaaSBilling?: boolean;
}

export interface HotelPartnerRequest {
    hotelName: string;
    city?: string;
    phone?: string;
    message?: string;
    submittedAt?: any;
    /** Chosen SaaS plan at signup (paid after approval in Billing). */
    preferredPlanCode?: string;
    /** Advanced partner KYC package */
    kyc?: HotelPartnerKyc;
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    name?: string;
    phone?: string;
    createdAt?: any;
    adminStatus?: 'pending' | 'approved' | 'rejected' | 'none';
    /** Hotel partner application status (separate from platform Super Admin). */
    hotelPartnerStatus?: HotelPartnerStatus;
    hotelPartnerRequest?: HotelPartnerRequest;
    /** Optional guest referral / promo code captured at signup. */
    referralCode?: string;
}

/** Public signup paths  BookAddis staff (Super Admin) is never self-serve. */
export type RegisterAccountType = 'guest' | 'hotel_partner';

export type RegisterOptions = {
    accountType?: RegisterAccountType;
    hotelPartner?: {
        /** Optional at account create  filled in later wizard steps when draft. */
        hotelName?: string;
        city?: string;
        phone?: string;
        message?: string;
        preferredPlanCode?: string;
        /** When true, create as draft (KYC incomplete). Default for stepped signup. */
        asDraft?: boolean;
        kyc?: HotelPartnerKyc;
    };
    referralCode?: string;
};

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    /** True once Firestore profile is loaded (or cached after login). Avoids routing with stale role=user. */
    profileReady: boolean;
    /** True when profile fetch failed and no cached profile exists for the signed-in user. */
    profileError: boolean;
    login: (email: string, password?: string) => Promise<UserRole>;
    register: (
        name: string,
        email: string,
        password?: string,
        options?: RegisterOptions,
    ) => Promise<void>;

    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<UserRole>;
    /** SMS MFA second step after `MfaSignInRequiredError` (Identity Platform). */
    sendSmsForMfaSignIn: (
        resolver: MultiFactorResolver,
        hintIndex: number,
        recaptchaVerifier: RecaptchaVerifier,
    ) => Promise<string>;
    completeSmsMfaSignIn: (
        resolver: MultiFactorResolver,
        verificationId: string,
        smsCode: string,
        emailForRateLimitGuard?: string,
    ) => Promise<UserRole>;
    /** Re-auth before enrolling MFA (password for email users, or Google popup). */
    reauthenticateForMfaEnrollment: (password?: string) => Promise<void>;
    sendMfaEnrollmentSms: (e164Phone: string, recaptchaVerifier: RecaptchaVerifier) => Promise<string>;
    completeMfaEnrollment: (verificationId: string, smsCode: string, displayName?: string) => Promise<void>;

    sendVerificationEmail: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    /** Email/password accounts only: re-authenticates then updates password. */
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    requireAuth: () => void;
    renderRecaptcha: (containerId?: string, size?: 'invisible' | 'normal', onSolved?: () => void) => Promise<void>;
    clearRecaptcha: () => void;
}
