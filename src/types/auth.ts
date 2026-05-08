import type { MultiFactorResolver, RecaptchaVerifier } from 'firebase/auth';

export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    name?: string;
    phone?: string;
    createdAt?: any;
    adminStatus?: 'pending' | 'approved' | 'rejected' | 'none';
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<UserRole>;
    register: (name: string, email: string, password?: string, requestAdmin?: boolean) => Promise<void>;

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
