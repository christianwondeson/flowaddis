/**
 * Server-only: CreateAssessment via @google-cloud/recaptcha-enterprise.
 * Uses Application Default Credentials, or JSON from GOOGLE_APPLICATION_CREDENTIALS_JSON.
 * @see https://cloud.google.com/recaptcha/docs/create-assessment
 */

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

let cachedClient: RecaptchaEnterpriseServiceClient | undefined;

function getRecaptchaEnterpriseClient(): RecaptchaEnterpriseServiceClient {
    if (!cachedClient) {
        const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
        if (raw) {
            try {
                cachedClient = new RecaptchaEnterpriseServiceClient({
                    credentials: JSON.parse(raw) as Record<string, unknown>,
                });
            } catch {
                throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON');
            }
        } else {
            cachedClient = new RecaptchaEnterpriseServiceClient();
        }
    }
    return cachedClient;
}

export function getRecaptchaProjectId(): string | undefined {
    const id =
        process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        process.env.GCP_PROJECT_ID?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    return id || undefined;
}

export function getRecaptchaSiteKeyServer(): string | undefined {
    const k =
        process.env.RECAPTCHA_ENTERPRISE_SITE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY?.trim();
    return k || undefined;
}

export type AssessmentOutcome =
    | { ok: true; score: number }
    | { ok: false; reason: string };

function parseMinScore(): number {
    const raw = process.env.RECAPTCHA_MIN_SCORE?.trim();
    if (!raw) return 0.5;
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(1, Math.max(0, n));
}

/**
 * Validates a client-side Enterprise token with Google's CreateAssessment API.
 */
export async function assessRecaptchaEnterpriseToken(params: {
    token: string;
    expectedAction: string;
}): Promise<AssessmentOutcome> {
    if (
        process.env.NODE_ENV !== 'production' &&
        process.env.RECAPTCHA_SKIP_SERVER_VERIFY === 'true'
    ) {
        console.warn('[recaptcha] RECAPTCHA_SKIP_SERVER_VERIFY=true — skipping CreateAssessment');
        return { ok: true, score: 1 };
    }

    const projectId = getRecaptchaProjectId();
    const siteKey = getRecaptchaSiteKeyServer();

    if (!projectId) {
        return {
            ok: false,
            reason: 'Server misconfiguration: set GOOGLE_CLOUD_PROJECT or GCP_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        };
    }
    if (!siteKey) {
        return {
            ok: false,
            reason: 'Server misconfiguration: set NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY',
        };
    }

    const client = getRecaptchaEnterpriseClient();
    const parent = client.projectPath(projectId);
    const threshold = parseMinScore();

    const request = {
        parent,
        assessment: {
            event: {
                token: params.token,
                siteKey,
                expectedAction: params.expectedAction,
            },
        },
    };

    let response;
    try {
        [response] = await client.createAssessment(request);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[recaptcha] createAssessment failed:', msg);
        return { ok: false, reason: 'reCAPTCHA verification failed' };
    }

    const tp = response.tokenProperties;
    if (!tp?.valid) {
        const ir = tp?.invalidReason ?? 'UNKNOWN';
        return { ok: false, reason: `Invalid token (${String(ir)})` };
    }

    if (tp.action !== params.expectedAction) {
        return { ok: false, reason: 'Action mismatch' };
    }

    const score =
        response.riskAnalysis?.score !== undefined && response.riskAnalysis?.score !== null
            ? Number(response.riskAnalysis.score)
            : 0;

    if (score < threshold) {
        return {
            ok: false,
            reason: `Score below threshold (${score.toFixed(2)} < ${threshold})`,
        };
    }

    return { ok: true, score };
}
