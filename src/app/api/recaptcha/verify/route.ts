import { NextResponse } from 'next/server';
import { assessRecaptchaEnterpriseToken } from '@/lib/recaptcha-enterprise-assessment';

export const runtime = 'nodejs';

const ALLOWED_ACTIONS = new Set(['LOGIN', 'GOOGLE_SIGNIN', 'SIGNUP']);

/**
 * POST body: { token: string, action: string }
 * Verifies reCAPTCHA Enterprise token via CreateAssessment (risk score + action).
 */
export async function POST(request: Request) {
    try {
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const token =
            body &&
            typeof body === 'object' &&
            'token' in body &&
            typeof (body as { token?: unknown }).token === 'string'
                ? (body as { token: string }).token.trim()
                : '';
        const action =
            body &&
            typeof body === 'object' &&
            'action' in body &&
            typeof (body as { action?: unknown }).action === 'string'
                ? (body as { action: string }).action.trim()
                : '';

        if (!token) {
            return NextResponse.json({ error: 'token is required' }, { status: 400 });
        }
        if (!action || !ALLOWED_ACTIONS.has(action)) {
            return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 });
        }

        const outcome = await assessRecaptchaEnterpriseToken({
            token,
            expectedAction: action,
        });

        if (outcome.ok) {
            return NextResponse.json({ ok: true, score: outcome.score });
        }

        return NextResponse.json({ ok: false, reason: outcome.reason }, { status: 403 });
    } catch (error) {
        console.error('[recaptcha] verify route error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
