/**
 * Server-only: CreateAssessment + AnnotateAssessment via @google-cloud/recaptcha-enterprise.
 * Uses Application Default Credentials, or JSON from GOOGLE_APPLICATION_CREDENTIALS_JSON.
 * @see https://cloud.google.com/recaptcha/docs/create-assessment
 * @see https://cloud.google.com/recaptcha/docs/account-defender
 */

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import type {
    RecaptchaAnnotation,
    RecaptchaAnnotateReason,
} from '@/lib/recaptcha-annotate-types';

export type { RecaptchaAnnotation, RecaptchaAnnotateReason } from '@/lib/recaptcha-annotate-types';

let cachedClient: RecaptchaEnterpriseServiceClient | undefined;

function parseServiceAccountJson(
    raw: string,
): Record<string, unknown> | null {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.includes('...') || trimmed === '{}') {
        return null;
    }
    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null;
        }
        const obj = parsed as Record<string, unknown>;
        if (obj.type !== 'service_account') {
            return null;
        }
        return obj;
    } catch {
        return null;
    }
}

function getRecaptchaEnterpriseClient(): RecaptchaEnterpriseServiceClient {
    if (!cachedClient) {
        const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
        if (raw) {
            const credentials = parseServiceAccountJson(raw);
            if (!credentials) {
                throw new Error(
                    'Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON  paste the full service-account JSON (one line), not a placeholder',
                );
            }
            cachedClient = new RecaptchaEnterpriseServiceClient({
                credentials,
            });
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
    | {
          ok: true;
          score: number;
          assessmentName?: string;
          accountDefenderLabels?: string[];
      }
    | { ok: false; reason: string; assessmentName?: string };

function hasGcpCredentialsForRecaptcha(): boolean {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
        return true;
    }
    const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
    if (!raw) return false;
    return parseServiceAccountJson(raw) !== null;
}

function parseMinScore(): number {
    const raw = process.env.RECAPTCHA_MIN_SCORE?.trim();
    if (!raw) return 0.5;
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(1, Math.max(0, n));
}

function shouldSkipCreateAssessment(): boolean {
    if (
        process.env.NODE_ENV !== 'production' &&
        process.env.RECAPTCHA_SKIP_SERVER_VERIFY === 'true'
    ) {
        return true;
    }
    if (process.env.NODE_ENV !== 'production' && !hasGcpCredentialsForRecaptcha()) {
        return true;
    }
    return false;
}

/**
 * Validates a client-side Enterprise token with Google's CreateAssessment API.
 * Pass accountId/email for Account defense attribution.
 */
export async function assessRecaptchaEnterpriseToken(params: {
    token: string;
    expectedAction: string;
    accountId?: string;
    email?: string;
    phoneNumber?: string;
}): Promise<AssessmentOutcome> {
    if (
        process.env.NODE_ENV !== 'production' &&
        process.env.RECAPTCHA_SKIP_SERVER_VERIFY === 'true'
    ) {
        console.warn('[recaptcha] RECAPTCHA_SKIP_SERVER_VERIFY=true  skipping CreateAssessment');
        return { ok: true, score: 1 };
    }

    /**
     * Local dev without a service account: `@google-cloud/*` uses Application Default Credentials;
     * without `gcloud auth application-default login` or env JSON, CreateAssessment throws
     * "Could not load the default credentials". Skip server verify in development only.
     */
    if (process.env.NODE_ENV !== 'production' && !hasGcpCredentialsForRecaptcha()) {
        const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
        if (raw && parseServiceAccountJson(raw) === null) {
            console.warn(
                '[recaptcha] Development: GOOGLE_APPLICATION_CREDENTIALS_JSON is invalid/placeholder  skipping CreateAssessment. Paste the full service-account JSON or use GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json',
            );
        } else {
            console.warn(
                '[recaptcha] Development: skipping CreateAssessment (no GOOGLE_APPLICATION_CREDENTIALS / GOOGLE_APPLICATION_CREDENTIALS_JSON). Client-side Enterprise execute still runs.',
            );
        }
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

    const expectedAction = params.expectedAction.trim().toLowerCase();
    const accountId = params.accountId?.trim() || params.email?.trim().toLowerCase() || undefined;
    const email = params.email?.trim().toLowerCase() || undefined;
    const phoneNumber = params.phoneNumber?.trim() || undefined;

    const userIds: Array<{ email?: string; phoneNumber?: string }> = [];
    if (email) userIds.push({ email });
    if (phoneNumber) userIds.push({ phoneNumber });

    const event: {
        token: string;
        siteKey: string;
        expectedAction: string;
        userInfo?: {
            accountId?: string;
            userIds?: Array<{ email?: string; phoneNumber?: string }>;
        };
    } = {
        token: params.token,
        siteKey,
        expectedAction,
    };

    if (accountId || userIds.length > 0) {
        event.userInfo = {
            ...(accountId ? { accountId } : {}),
            ...(userIds.length > 0 ? { userIds } : {}),
        };
    }

    const request = {
        parent,
        assessment: {
            event,
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

    const assessmentName = response.name || undefined;
    const accountDefenderLabels =
        response.accountDefenderAssessment?.labels?.map((l) => String(l)) ?? [];

    const tp = response.tokenProperties;
    if (!tp?.valid) {
        const ir = tp?.invalidReason ?? 'UNKNOWN';
        return {
            ok: false,
            reason: `Invalid token (${String(ir)})`,
            assessmentName,
        };
    }

    if (tp.action?.toLowerCase() !== expectedAction) {
        return { ok: false, reason: 'Action mismatch', assessmentName };
    }

    const score =
        response.riskAnalysis?.score !== undefined && response.riskAnalysis?.score !== null
            ? Number(response.riskAnalysis.score)
            : 0;

    if (score < threshold) {
        return {
            ok: false,
            reason: `Score below threshold (${score.toFixed(2)} < ${threshold})`,
            assessmentName,
        };
    }

    return { ok: true, score, assessmentName, accountDefenderLabels };
}

/**
 * Annotates a prior assessment so Account defense can tune the site model.
 * No-ops when credentials are missing in development.
 */
export async function annotateRecaptchaAssessment(params: {
    assessmentName: string;
    annotation?: RecaptchaAnnotation;
    reasons?: RecaptchaAnnotateReason[];
    accountId?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
    const name = params.assessmentName.trim();
    if (!name) {
        return { ok: false, reason: 'assessmentName is required' };
    }

    if (shouldSkipCreateAssessment()) {
        console.warn('[recaptcha] Skipping annotateAssessment (dev skip / no credentials)');
        return { ok: true };
    }

    const client = getRecaptchaEnterpriseClient();

    try {
        await client.annotateAssessment({
            name,
            ...(params.annotation
                ? {
                      annotation: params.annotation as 'LEGITIMATE' | 'FRAUDULENT',
                  }
                : {}),
            ...(params.reasons?.length
                ? {
                      // Node client accepts enum name strings at runtime.
                      reasons: params.reasons as unknown as Array<
                          'CORRECT_PASSWORD' | 'INCORRECT_PASSWORD' | 'INITIATED_TWO_FACTOR' | 'PASSED_TWO_FACTOR' | 'FAILED_TWO_FACTOR'
                      >,
                  }
                : {}),
            ...(params.accountId?.trim()
                ? { accountId: params.accountId.trim().toLowerCase() }
                : {}),
        } as Parameters<RecaptchaEnterpriseServiceClient['annotateAssessment']>[0]);
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[recaptcha] annotateAssessment failed:', msg);
        return { ok: false, reason: 'Annotation failed' };
    }
}
