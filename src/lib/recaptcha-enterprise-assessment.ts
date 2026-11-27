/**
 * Server-only: CreateAssessment + AnnotateAssessment via @google-cloud/recaptcha-enterprise.
 * Uses Application Default Credentials, JSON from GOOGLE_APPLICATION_CREDENTIALS_JSON,
 * GOOGLE_APPLICATION_CREDENTIALS file path, or fallback to Firebase Admin Service Account.
 * @see https://cloud.google.com/recaptcha/docs/create-assessment
 * @see https://cloud.google.com/recaptcha/docs/account-defender
 */

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import type {
    RecaptchaAnnotation,
    RecaptchaAnnotateReason,
} from '@/lib/recaptcha-annotate-types';

export type { RecaptchaAnnotation, RecaptchaAnnotateReason } from '@/lib/recaptcha-annotate-types';

let cachedClient: RecaptchaEnterpriseServiceClient | null | undefined;
let warnedNoCredentials = false;

interface ResolvedGcpCredentials {
    credentials?: {
        client_email?: string;
        private_key?: string;
        [key: string]: unknown;
    };
    keyFilename?: string;
    projectId?: string;
}

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

function normalizePrivateKeyPem(raw: string): string | null {
    let k = raw.trim();
    if (
        (k.startsWith('"') && k.endsWith('"')) ||
        (k.startsWith("'") && k.endsWith("'"))
    ) {
        k = k.slice(1, -1);
    }
    k = k.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\\n/g, '\n');
    if (!k.includes('BEGIN PRIVATE KEY')) {
        return null;
    }
    return k.trim();
}

export function getRecaptchaProjectId(): string | undefined {
    const id =
        process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        process.env.GCP_PROJECT_ID?.trim() ||
        process.env.ADMIN_FIREBASE_PROJECT_ID?.trim() ||
        process.env.FIREBASE_PROJECT_ID?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    return id || undefined;
}

export function getRecaptchaSiteKeyServer(): string | undefined {
    const k =
        process.env.RECAPTCHA_ENTERPRISE_SITE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY?.trim();
    return k || undefined;
}

function resolveGcpCredentials(): ResolvedGcpCredentials | null {
    // 1. Full service-account JSON in environment variable
    const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
    if (rawJson) {
        const parsed = parseServiceAccountJson(rawJson);
        if (parsed) {
            return {
                credentials: parsed as { client_email?: string; private_key?: string },
                projectId: (parsed.project_id as string) || getRecaptchaProjectId(),
            };
        }
    }

    // 2. File path to service-account JSON
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    if (credPath) {
        return {
            keyFilename: credPath,
            projectId: getRecaptchaProjectId(),
        };
    }

    // 3. Fallback to Firebase Admin Service Account credentials if available
    const clientEmail =
        process.env.ADMIN_FIREBASE_CLIENT_EMAIL?.trim() ||
        process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const rawPrivateKey =
        process.env.ADMIN_FIREBASE_PRIVATE_KEY ||
        process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = rawPrivateKey ? normalizePrivateKeyPem(rawPrivateKey) : null;
    const projectId = getRecaptchaProjectId();

    if (clientEmail && privateKey) {
        return {
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            projectId,
        };
    }

    return null;
}

function hasGcpCredentialsForRecaptcha(): boolean {
    return resolveGcpCredentials() !== null;
}

function getRecaptchaEnterpriseClient(): RecaptchaEnterpriseServiceClient | null {
    if (cachedClient === undefined) {
        const resolved = resolveGcpCredentials();
        if (!resolved) {
            // Do not call new RecaptchaEnterpriseServiceClient() with no credentials
            // as it triggers internal ADC discovery, pings 169.254.169.254, and throws unhandledRejection
            cachedClient = null;
            return null;
        }

        try {
            cachedClient = new RecaptchaEnterpriseServiceClient({
                ...(resolved.credentials ? { credentials: resolved.credentials } : {}),
                ...(resolved.keyFilename ? { keyFilename: resolved.keyFilename } : {}),
                ...(resolved.projectId ? { projectId: resolved.projectId } : {}),
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('[recaptcha] Failed to instantiate RecaptchaEnterpriseServiceClient:', msg);
            cachedClient = null;
            return null;
        }
    }
    return cachedClient;
}

export type AssessmentOutcome =
    | {
          ok: true;
          score: number;
          assessmentName?: string;
          accountDefenderLabels?: string[];
      }
    | { ok: false; reason: string; assessmentName?: string };

function parseMinScore(): number {
    const raw = process.env.RECAPTCHA_MIN_SCORE?.trim();
    if (!raw) return 0.5;
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(1, Math.max(0, n));
}

function isBypassRequested(): boolean {
    const val = process.env.RECAPTCHA_SKIP_SERVER_VERIFY?.trim().toLowerCase();
    return val === 'true' || val === '1';
}

function isEnforceRequired(): boolean {
    const val = process.env.RECAPTCHA_ENFORCE?.trim().toLowerCase();
    return val === 'true' || val === '1';
}

function shouldSkipCreateAssessment(): boolean {
    if (isBypassRequested()) {
        return true;
    }
    if (!hasGcpCredentialsForRecaptcha() && !isEnforceRequired()) {
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
    // 1. Explicit bypass flag (works in development and production)
    if (isBypassRequested()) {
        return { ok: true, score: 1 };
    }

    // 2. Validate availability of GCP / Firebase credentials
    if (!hasGcpCredentialsForRecaptcha()) {
        if (isEnforceRequired()) {
            return {
                ok: false,
                reason: 'Server misconfiguration: set GOOGLE_APPLICATION_CREDENTIALS_JSON or Firebase service account',
            };
        }
        if (!warnedNoCredentials) {
            warnedNoCredentials = true;
            console.warn(
                '[recaptcha] Notice: Google Cloud service account credentials not configured for reCAPTCHA Enterprise. Skipping assessment (score=1) to prevent user lockout. To enforce assessment, set GOOGLE_APPLICATION_CREDENTIALS_JSON and RECAPTCHA_ENFORCE=true.',
            );
        }
        return { ok: true, score: 1 };
    }

    const projectId = getRecaptchaProjectId();
    const siteKey = getRecaptchaSiteKeyServer();

    if (!projectId) {
        if (isEnforceRequired()) {
            return {
                ok: false,
                reason: 'Server misconfiguration: set GOOGLE_CLOUD_PROJECT or GCP_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID',
            };
        }
        return { ok: true, score: 1 };
    }
    if (!siteKey) {
        if (isEnforceRequired()) {
            return {
                ok: false,
                reason: 'Server misconfiguration: set NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY',
            };
        }
        return { ok: true, score: 1 };
    }

    const client = getRecaptchaEnterpriseClient();
    if (!client) {
        if (isEnforceRequired()) {
            return { ok: false, reason: 'reCAPTCHA service client initialization failed' };
        }
        return { ok: true, score: 1 };
    }

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

        // When not strictly enforcing, fail open on permission denied or ADC errors
        // so that misconfigured IAM does not lock guests/admins out of the platform.
        if (!isEnforceRequired()) {
            console.warn(
                `[recaptcha] createAssessment failed (${msg}). Failing open (score=1) to prevent user lockout. Grant 'roles/recaptchaenterprise.agent' to the service account in Google Cloud Console or set RECAPTCHA_ENFORCE=true.`,
            );
            return { ok: true, score: 1 };
        }
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
 * No-ops when credentials are missing or in bypass mode.
 */
export async function annotateRecaptchaAssessment(params: {
    assessmentName: string;
    annotation?: RecaptchaAnnotation;
    reasons?: RecaptchaAnnotateReason[];
    accountId?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
    const name = params.assessmentName?.trim();
    if (!name) {
        return { ok: false, reason: 'assessmentName is required' };
    }

    if (shouldSkipCreateAssessment()) {
        return { ok: true };
    }

    const client = getRecaptchaEnterpriseClient();
    if (!client) {
        return { ok: true };
    }

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
        console.warn('[recaptcha] annotateAssessment failed:', msg);
        return { ok: false, reason: 'Annotation failed' };
    }
}
