'use client';

import type { RecaptchaAnnotation, RecaptchaAnnotateReason } from '@/lib/recaptcha-annotate-types';

export type VerifyRecaptchaApiResult =
    | { ok: true; score?: number; assessmentName?: string }
    | { ok: false; reason: string; assessmentName?: string };

const ASSESSMENT_STORAGE_KEY = 'bookaddis_recaptcha_assessment';

type StoredAssessment = {
    assessmentName: string;
    accountId: string;
};

/** Persist assessment name for later annotate (e.g. after MFA). */
export function storeRecaptchaAssessment(assessmentName: string, accountId: string): void {
    if (typeof window === 'undefined' || !assessmentName) return;
    const payload: StoredAssessment = {
        assessmentName,
        accountId: accountId.trim().toLowerCase(),
    };
    try {
        sessionStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        /* ignore quota / private mode */
    }
}

export function peekRecaptchaAssessment(): StoredAssessment | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(ASSESSMENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredAssessment;
        if (!parsed?.assessmentName) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearRecaptchaAssessment(): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

/**
 * Sends the Enterprise execute token to our API for CreateAssessment verification.
 */
export async function verifyRecaptchaEnterpriseWithApi(
    token: string,
    action: string,
    opts?: { accountId?: string; email?: string },
): Promise<VerifyRecaptchaApiResult> {
    const email = opts?.email?.trim().toLowerCase();
    const accountId = (opts?.accountId || email || '').trim().toLowerCase() || undefined;

    const res = await fetch('/api/recaptcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token,
            action,
            ...(accountId ? { accountId } : {}),
            ...(email ? { email } : {}),
        }),
    });

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        return { ok: false, reason: 'Invalid response from verification service' };
    }

    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const assessmentName =
        typeof obj.assessmentName === 'string' ? obj.assessmentName : undefined;

    if (res.ok && obj.ok === true) {
        const score = typeof obj.score === 'number' ? obj.score : undefined;
        if (assessmentName && accountId) {
            storeRecaptchaAssessment(assessmentName, accountId);
        }
        return { ok: true, score, assessmentName };
    }

    const reason =
        typeof obj.reason === 'string'
            ? obj.reason
            : typeof obj.error === 'string'
              ? obj.error
              : res.status === 403
                ? 'Verification rejected'
                : 'Verification failed';

    return { ok: false, reason, assessmentName };
}

/**
 * Fire-and-forget annotate; never throws to the caller.
 */
export async function annotateRecaptchaAssessmentWithApi(params: {
    assessmentName?: string;
    annotation?: RecaptchaAnnotation;
    reasons?: RecaptchaAnnotateReason[];
    accountId?: string;
    /** When true, remove stored assessment after annotate. */
    clearStored?: boolean;
}): Promise<void> {
    const stored = peekRecaptchaAssessment();
    const assessmentName = params.assessmentName || stored?.assessmentName;
    const accountId = params.accountId || stored?.accountId;
    if (!assessmentName) return;

    try {
        await fetch('/api/recaptcha/annotate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assessmentName,
                ...(params.annotation ? { annotation: params.annotation } : {}),
                ...(params.reasons?.length ? { reasons: params.reasons } : {}),
                ...(accountId ? { accountId } : {}),
            }),
        });
    } catch (e) {
        console.warn('[recaptcha] annotate request failed', e);
    } finally {
        if (params.clearStored === true) {
            clearRecaptchaAssessment();
        }
    }
}

export function isIncorrectPasswordAuthError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) return false;
    const code = (error as { code?: unknown }).code;
    return (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found'
    );
}
