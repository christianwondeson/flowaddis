import type { MultiFactorResolver } from 'firebase/auth';

/**
 * Thrown when first-factor succeeded but SMS MFA is required (Identity Platform MFA).
 */
export class MfaSignInRequiredError extends Error {
    readonly code = 'app/mfa-sign-in-required';

    constructor(
        public readonly resolver: MultiFactorResolver,
        /** Email typed on sign-in form (email/password flow); may be unset for Google popup. */
        public readonly loginHintEmail?: string,
    ) {
        super('Additional verification required');
        this.name = 'MfaSignInRequiredError';
        Object.setPrototypeOf(this, MfaSignInRequiredError.prototype);
    }
}

export function isMfaSignInRequiredError(e: unknown): e is MfaSignInRequiredError {
    return e instanceof MfaSignInRequiredError;
}
