import { NextResponse } from 'next/server';
import { assessRecaptchaEnterpriseToken } from '@/lib/recaptcha-enterprise-assessment';
import { ALLOWED_RECAPTCHA_ACTIONS } from '@/lib/recaptcha-actions';

export const runtime = 'nodejs';

/**
 * POST body: { token: string, action: string, accountId?: string, email?: string }
 * Verifies reCAPTCHA Enterprise token via CreateAssessment (risk score + Account defense).
 */
export async function POST(request: Request) {
    try {
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

        const token = typeof obj.token === 'string' ? obj.token.trim() : '';
        const action = typeof obj.action === 'string' ? obj.action.trim().toLowerCase() : '';
        const accountId = typeof obj.accountId === 'string' ? obj.accountId.trim() : undefined;
        const email = typeof obj.email === 'string' ? obj.email.trim() : undefined;

        if (!token) {
            return NextResponse.json({ error: 'token is required' }, { status: 400 });
        }
        if (!action || !ALLOWED_RECAPTCHA_ACTIONS.has(action)) {
            return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 });
        }

        const outcome = await assessRecaptchaEnterpriseToken({
            token,
            expectedAction: action,
            accountId,
            email,
        });

        if (outcome.ok) {
            return NextResponse.json({
                ok: true,
                score: outcome.score,
                ...(outcome.assessmentName ? { assessmentName: outcome.assessmentName } : {}),
                ...(outcome.accountDefenderLabels?.length
                    ? { accountDefenderLabels: outcome.accountDefenderLabels }
                    : {}),
            });
        }

        return NextResponse.json(
            {
                ok: false,
                reason: outcome.reason,
                ...(outcome.assessmentName ? { assessmentName: outcome.assessmentName } : {}),
            },
            { status: 403 },
        );
    } catch (error) {
        console.error('[recaptcha] verify route error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
