import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS_URL =
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
    }
    return jwks;
}

/** Server-side project id (prefer non-public env in production). */
export function getFirebaseProjectIdForAuth(): string {
    const id = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!id?.trim()) {
        throw new Error('FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID must be set for JWT verification');
    }
    return id.trim();
}

/**
 * Verifies a Firebase ID token using Google's JWKS (RS256 only).
 * Rejects forged tokens, alg stripping, and non-Firebase issuers/audiences.
 */
export async function verifyFirebaseIdToken(idToken: string) {
    const projectId = getFirebaseProjectIdForAuth();
    const { payload } = await jwtVerify(idToken, getJwks(), {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        algorithms: ['RS256'],
    });
    return payload;
}
