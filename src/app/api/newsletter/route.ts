import { NextResponse } from 'next/server';
import {
    getAdminFirestore,
    isFirebaseAdminConfigured,
} from '@/lib/server/firebase-admin';

function normalizeEmail(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const email = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return null;
    }
    return email;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as { email?: string };
        const email = normalizeEmail(body.email);
        if (!email) {
            return NextResponse.json(
                { error: 'invalid_email', message: 'Enter a valid email address.' },
                { status: 400 },
            );
        }

        if (!isFirebaseAdminConfigured()) {
            return NextResponse.json(
                { error: 'misconfigured', message: 'Newsletter is unavailable.' },
                { status: 503 },
            );
        }

        const db = getAdminFirestore();
        const ref = db.collection('newsletter_subscribers').doc(email);
        const existing = await ref.get();
        if (existing.exists) {
            return NextResponse.json({ ok: true, already: true });
        }

        await ref.set({
            email,
            created_at: new Date().toISOString(),
            source: 'footer',
            user_agent: req.headers.get('user-agent')?.slice(0, 300) || null,
        });

        return NextResponse.json({ ok: true, already: false });
    } catch (e) {
        console.error('newsletter subscribe', e);
        return NextResponse.json(
            { error: 'server_error', message: 'Could not subscribe.' },
            { status: 500 },
        );
    }
}
