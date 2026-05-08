'use client';

export type VerifyRecaptchaApiResult =
    | { ok: true; score?: number }
    | { ok: false; reason: string };

/**
 * Sends the Enterprise execute token to our API for CreateAssessment verification.
 */
export async function verifyRecaptchaEnterpriseWithApi(
    token: string,
    action: string,
): Promise<VerifyRecaptchaApiResult> {
    const res = await fetch('/api/recaptcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
    });

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        return { ok: false, reason: 'Invalid response from verification service' };
    }

    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

    if (res.ok && obj.ok === true) {
        const score = typeof obj.score === 'number' ? obj.score : undefined;
        return { ok: true, score };
    }

    const reason =
        typeof obj.reason === 'string'
            ? obj.reason
            : typeof obj.error === 'string'
              ? obj.error
              : res.status === 403
                ? 'Verification rejected'
                : 'Verification failed';

    return { ok: false, reason };
}
