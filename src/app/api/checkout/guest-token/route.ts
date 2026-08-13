import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/server/firebase-admin';
import { assertGuestTokenRateLimit } from '@/lib/guest-token-rate-limit';

export const runtime = 'nodejs';

function clientIp(request: Request): string {
    const xf = request.headers.get('x-forwarded-for');
    if (xf) {
        const first = xf.split(',')[0]?.trim();
        if (first) return first;
    }
    return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function isAllowedOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return true;
    const allowed = [
        process.env.NEXT_PUBLIC_APP_ORIGIN?.trim(),
        process.env.NEXT_PUBLIC_SITE_URL?.trim(),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ].filter(Boolean) as string[];

    try {
        const o = new URL(origin);
        return allowed.some((a) => {
            try {
                return new URL(a).origin === o.origin;
            } catch {
                return false;
            }
        });
    } catch {
        return false;
    }
}

/**
 * Mints a short-lived Firebase custom token for guest checkout.
 *
 * Important: we do NOT attach the guest email to a Firebase Auth user.
 * That would block later signup and falsely return ACCOUNT_EXISTS for
 * people who only ever paid as guests. Contact lives on the booking snapshot.
 *
 * Body: { email: string, phone: string, name?: string }
 */
export async function POST(request: Request) {
    try {
        if (!isAllowedOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
        }

        if (!isFirebaseAdminConfigured()) {
            return NextResponse.json(
                {
                    error:
                        'Guest checkout is unavailable (Firebase Admin not configured on the server). Sign in to continue.',
                },
                { status: 503 },
            );
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
        const email =
            typeof obj.email === 'string' ? obj.email.trim().toLowerCase() : '';
        const phone = typeof obj.phone === 'string' ? obj.phone.trim() : '';
        const name = typeof obj.name === 'string' ? obj.name.trim().slice(0, 120) : '';

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
        }
        if (phone.replace(/\D/g, '').length < 8 || phone.length > 32) {
            return NextResponse.json(
                { error: 'A valid phone number is required for guest checkout' },
                { status: 400 },
            );
        }

        const rl = assertGuestTokenRateLimit({ ip: clientIp(request), email });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many guest checkout attempts. Try again later or sign in.' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(rl.retryAfterSec) },
                },
            );
        }

        const auth = getAdminAuth();

        // Ephemeral Auth user  no email on the Auth record (booking holds contact).
        const uid = `guest_${randomBytes(16).toString('hex')}`;
        await auth.createUser({
            uid,
            displayName: name || 'Guest',
            disabled: false,
        });

        const customToken = await auth.createCustomToken(uid, {
            checkoutGuest: true,
            guestEmail: email,
            guestPhone: phone,
        });

        return NextResponse.json({ customToken });
    } catch (error) {
        console.error('[checkout/guest-token]', error);
        const msg = error instanceof Error ? error.message : String(error);
        // Surface clearer hint when Identity Platform blocks Admin user creation too.
        if (msg.includes('ADMIN_ONLY_OPERATION') || msg.includes('PERMISSION_DENIED')) {
            return NextResponse.json(
                {
                    error:
                        'Guest checkout is blocked by Firebase project settings. Enable Admin user creation for the service account, or sign in to pay.',
                },
                { status: 503 },
            );
        }
        return NextResponse.json(
            { error: 'Could not start guest checkout. Please sign in and try again.' },
            { status: 500 },
        );
    }
}
