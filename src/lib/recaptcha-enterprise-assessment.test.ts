import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    assessRecaptchaEnterpriseToken,
    annotateRecaptchaAssessment,
    getRecaptchaProjectId,
    getRecaptchaSiteKeyServer,
} from './recaptcha-enterprise-assessment';

describe('recaptcha-enterprise-assessment', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.RECAPTCHA_SKIP_SERVER_VERIFY;
        delete process.env.RECAPTCHA_ENFORCE;
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        delete process.env.ADMIN_FIREBASE_CLIENT_EMAIL;
        delete process.env.FIREBASE_CLIENT_EMAIL;
        delete process.env.ADMIN_FIREBASE_PRIVATE_KEY;
        delete process.env.FIREBASE_PRIVATE_KEY;
        delete process.env.GOOGLE_CLOUD_PROJECT;
        delete process.env.GCP_PROJECT_ID;
        delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        delete process.env.RECAPTCHA_ENTERPRISE_SITE_KEY;
        delete process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
    });

    describe('Environment helpers', () => {
        it('resolves project ID from available env vars', () => {
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'my-project';
            expect(getRecaptchaProjectId()).toBe('my-project');

            process.env.GCP_PROJECT_ID = 'gcp-project';
            expect(getRecaptchaProjectId()).toBe('gcp-project');

            process.env.GOOGLE_CLOUD_PROJECT = 'google-project';
            expect(getRecaptchaProjectId()).toBe('google-project');
        });

        it('resolves site key from server or public env vars', () => {
            process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY = 'site-key-1';
            expect(getRecaptchaSiteKeyServer()).toBe('site-key-1');

            process.env.RECAPTCHA_ENTERPRISE_SITE_KEY = 'server-site-key';
            expect(getRecaptchaSiteKeyServer()).toBe('server-site-key');
        });
    });

    describe('assessRecaptchaEnterpriseToken', () => {
        it('skips verification and returns score 1 when RECAPTCHA_SKIP_SERVER_VERIFY=true', async () => {
            process.env.RECAPTCHA_SKIP_SERVER_VERIFY = 'true';
            const outcome = await assessRecaptchaEnterpriseToken({
                token: 'any-token',
                expectedAction: 'login',
            });
            expect(outcome).toEqual({ ok: true, score: 1 });
        });

        it('gracefully fails open (score 1) when credentials are not configured and RECAPTCHA_ENFORCE is not set', async () => {
            const outcome = await assessRecaptchaEnterpriseToken({
                token: 'any-token',
                expectedAction: 'login',
            });
            expect(outcome.ok).toBe(true);
            if (outcome.ok) {
                expect(outcome.score).toBe(1);
            }
        });

        it('fails closed when RECAPTCHA_ENFORCE=true and credentials are not configured', async () => {
            process.env.RECAPTCHA_ENFORCE = 'true';
            const outcome = await assessRecaptchaEnterpriseToken({
                token: 'any-token',
                expectedAction: 'login',
            });
            expect(outcome.ok).toBe(false);
            if (!outcome.ok) {
                expect(outcome.reason).toContain('Server misconfiguration');
            }
        });
    });

    describe('annotateRecaptchaAssessment', () => {
        it('safely completes when RECAPTCHA_SKIP_SERVER_VERIFY=true', async () => {
            process.env.RECAPTCHA_SKIP_SERVER_VERIFY = 'true';
            const result = await annotateRecaptchaAssessment({
                assessmentName: 'projects/123/assessments/456',
                annotation: 'LEGITIMATE',
            });
            expect(result).toEqual({ ok: true });
        });

        it('safely completes when no credentials exist and not enforcing', async () => {
            const result = await annotateRecaptchaAssessment({
                assessmentName: 'projects/123/assessments/456',
                annotation: 'LEGITIMATE',
            });
            expect(result).toEqual({ ok: true });
        });

        it('returns error when assessmentName is empty', async () => {
            const result = await annotateRecaptchaAssessment({
                assessmentName: '',
            });
            expect(result).toEqual({ ok: false, reason: 'assessmentName is required' });
        });
    });
});
