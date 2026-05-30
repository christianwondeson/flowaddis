/**
 * Safe Firebase Auth error messages for end users.
 * Never return raw `error.message` — REST failures often embed project numbers,
 * API hostnames (identitytoolkit.googleapis.com), key restriction hints, etc.
 */

export const GENERIC_AUTH_FAILURE = 'Unable to complete this request. Please try again.';

function codeFrom(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const c = (error as { code?: unknown }).code;
        return typeof c === 'string' ? c : '';
    }
    return '';
}

/** Structured logging without printing raw API bodies in production builds. */
export function logFirebaseAuthError(context: string, error: unknown): void {
    const code = codeFrom(error);
    if (process.env.NODE_ENV === 'development') {
        console.error(`[firebase-auth:${context}]`, code || '(no code)', error);
    } else {
        console.error(`[firebase-auth:${context}]`, code || '(no code)');
    }
}

/**
 * Maps Firebase Auth errors to short, safe user-facing strings.
 * Unknown / non-auth errors → generic message; details logged only via {@link logFirebaseAuthError}.
 */
export function getFirebaseAuthUserMessage(error: unknown, context: string): string {
    const code = codeFrom(error);

    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Invalid email or password. Please check your credentials and try again.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support for assistance.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a few minutes before trying again.';
        case 'auth/network-request-failed':
            return 'Network connection error. Please check your internet and try again.';

        case 'auth/invalid-custom-token':
        case 'auth/custom-token-mismatch':
            return 'Sign-in session was rejected. Please sign in again.';
        case 'permission-denied':
            return 'Your account signed in, but profile data could not be loaded. Try again or contact support if this persists.';

        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Try signing in instead.';
        case 'auth/weak-password':
            return 'Your password is too weak. Use at least 12 characters with uppercase, lowercase, a number, and a symbol.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/missing-email':
            return 'Please enter your email address.';
        case 'auth/operation-not-allowed':
            return 'Email/password sign-in is currently disabled. Please contact support.';
        case 'auth/requires-recent-login':
            return 'For security, sign out and sign in again, then try changing your password.';

        case 'auth/expired-action-code':
            return 'This link has expired. Please request a new one.';
        case 'auth/invalid-action-code':
            return 'This link is invalid or has already been used.';

        case 'auth/captcha-check-failed':
            return 'Verification failed. Please solve the reCAPTCHA again.';
        case 'auth/invalid-verification-code':
            return 'Invalid verification code. Please check the SMS and try again.';
        case 'auth/code-expired':
            return 'That code has expired. Request a new SMS code.';

        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign-in was cancelled.';
        case 'auth/popup-blocked':
            return 'The sign-in pop-up was blocked. Allow pop-ups for this site and try again.';

        default:
            logFirebaseAuthError(context, error);
            return GENERIC_AUTH_FAILURE;
    }
}
