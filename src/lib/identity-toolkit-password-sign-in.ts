/**
 * Server-side Firebase Identity Toolkit — password sign-in (no client SDK).
 * Failures stay on the server; callers must return uniform HTTP responses to clients.
 */

export type IdentityToolkitPasswordSuccess = {
    idToken?: string;
    refreshToken?: string;
    expiresIn?: string;
    localId?: string;
    email?: string;
    registered?: boolean;
    mfaPendingCredential?: string;
    mfaInfo?: unknown[];
};

export async function identityToolkitSignInWithPassword(
    apiKey: string,
    email: string,
    password: string,
): Promise<
    | { ok: true; data: IdentityToolkitPasswordSuccess }
    | { ok: false; httpStatus: number; data: unknown }
> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
        }),
    });

    const data = (await res.json()) as IdentityToolkitPasswordSuccess & {
        error?: { message?: string; errors?: unknown[] };
    };

    if (!res.ok || data.error) {
        return { ok: false, httpStatus: res.status, data };
    }

    return { ok: true, data };
}
