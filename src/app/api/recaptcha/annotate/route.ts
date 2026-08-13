import { NextResponse } from 'next/server';
import { annotateRecaptchaAssessment } from '@/lib/recaptcha-enterprise-assessment';
import type {
    RecaptchaAnnotation,
    RecaptchaAnnotateReason,
} from '@/lib/recaptcha-annotate-types';

export const runtime = 'nodejs';

const ALLOWED_ANNOTATIONS = new Set<RecaptchaAnnotation>(['LEGITIMATE', 'FRAUDULENT']);

const ALLOWED_REASONS = new Set<RecaptchaAnnotateReason>([
    'CORRECT_PASSWORD',
    'INCORRECT_PASSWORD',
    'INITIATED_TWO_FACTOR',
    'PASSED_TWO_FACTOR',
    'FAILED_TWO_FACTOR',
]);

/**
 * POST body: {
 *   assessmentName: string,
 *   annotation?: 'LEGITIMATE' | 'FRAUDULENT',
 *   reasons?: RecaptchaAnnotateReason[],
 *   accountId?: string
 * }
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
        const assessmentName =
            typeof obj.assessmentName === 'string' ? obj.assessmentName.trim() : '';
        if (!assessmentName) {
            return NextResponse.json({ error: 'assessmentName is required' }, { status: 400 });
        }

        let annotation: RecaptchaAnnotation | undefined;
        if (typeof obj.annotation === 'string') {
            if (!ALLOWED_ANNOTATIONS.has(obj.annotation as RecaptchaAnnotation)) {
                return NextResponse.json({ error: 'Invalid annotation' }, { status: 400 });
            }
            annotation = obj.annotation as RecaptchaAnnotation;
        }

        const reasons: RecaptchaAnnotateReason[] = [];
        if (Array.isArray(obj.reasons)) {
            for (const r of obj.reasons) {
                if (typeof r !== 'string' || !ALLOWED_REASONS.has(r as RecaptchaAnnotateReason)) {
                    return NextResponse.json({ error: 'Invalid reasons' }, { status: 400 });
                }
                reasons.push(r as RecaptchaAnnotateReason);
            }
        }

        const accountId = typeof obj.accountId === 'string' ? obj.accountId.trim() : undefined;

        const outcome = await annotateRecaptchaAssessment({
            assessmentName,
            annotation,
            reasons: reasons.length ? reasons : undefined,
            accountId,
        });

        if (!outcome.ok) {
            return NextResponse.json({ ok: false, reason: outcome.reason }, { status: 502 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[recaptcha] annotate route error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
