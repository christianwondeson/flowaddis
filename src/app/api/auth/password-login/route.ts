import { NextResponse } from 'next/server';
import { identityToolkitSignInWithPassword } from '@/lib/identity-toolkit-password-sign-in';
import { createFirebaseCustomToken } from '@/lib/server/firebase-admin';
import {
    getClientIpFromHeaders,
    isPasswordLoginIpBlocked,
    recordPasswordLoginFailure,
    recordPasswordLoginSuccess,
} from '@/lib/password-login-rate-limit';

export const runtime = 'nodejs';

/** Fixed-length JSON for all credential failures — avoids response-size oracle (CWE-204 / enumeration). */
const FAILURE_JSON = '{"ok":false,"error":"INVALID_CREDENTIALS"}';

/** Minimum wall-clock duration per request (limits timing side channels vs failures). */
const MIN_RESPONSE_MS = 450;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enforceMinimumDuration(startedAt: number): Promise<void> {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_RESPONSE_MS) {
        await sleep(MIN_RESPONSE_MS - elapsed);
    }
}

function failure401(): NextResponse {
    return new NextResponse(FAILURE_JSON, {
        status: 401,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

export async function POST(request: Request) {
    const startedAt = Date.now();

    try {
        const ip = getClientIpFromHeaders(request);
        const blocked = isPasswordLoginIpBlocked(ip);
        if (blocked.blocked) {
            await enforceMinimumDuration(startedAt);
            const res = NextResponse.json(
                { ok: false, error: 'RATE_LIMITED' },
                { status: 429, headers: { 'Cache-Control': 'no-store' } },
            );
            if (blocked.retryAfterSec != null) {
                res.headers.set('Retry-After', String(blocked.retryAfterSec));
            }
            return res;
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            recordPasswordLoginFailure(ip);
            await enforceMinimumDuration(startedAt);
            return failure401();
        }

        const email =
            typeof body === 'object' &&
            body !== null &&
            'email' in body &&
            typeof (body as { email?: unknown }).email === 'string'
                ? (body as { email: string }).email.trim()
                : '';
        const password =
            typeof body === 'object' &&
            body !== null &&
            'password' in body &&
            typeof (body as { password?: unknown }).password === 'string'
                ? (body as { password: string }).password
                : '';

        if (!email || !password || password.length > 4096) {
            recordPasswordLoginFailure(ip);
            await enforceMinimumDuration(startedAt);
            return failure401();
        }

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
        if (!apiKey) {
            console.error('[password-login] NEXT_PUBLIC_FIREBASE_API_KEY is not set');
            recordPasswordLoginFailure(ip);
            await enforceMinimumDuration(startedAt);
            return failure401();
        }

        const result = await identityToolkitSignInWithPassword(apiKey, email, password);

        if (!result.ok) {
            recordPasswordLoginFailure(ip);
            await enforceMinimumDuration(startedAt);
            return failure401();
        }

        const { data } = result;

        /** Identity Platform MFA — first factor succeeded; second factor must run in the client SDK. */
        if (data.mfaPendingCredential && !data.idToken) {
            recordPasswordLoginSuccess(ip);
            await enforceMinimumDuration(startedAt);
            return NextResponse.json(
                { ok: true, requiresClientMfa: true },
                { status: 200, headers: { 'Cache-Control': 'no-store' } },
            );
        }

        const uid = data.localId;
        if (!uid || !data.idToken) {
            recordPasswordLoginFailure(ip);
            await enforceMinimumDuration(startedAt);
            return failure401();
        }

        const customToken = await createFirebaseCustomToken(uid);
        if (!customToken) {
            console.error(
                '[password-login] Firebase Admin unavailable — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY on the Next.js server',
            );
            recordPasswordLoginFailure(ip);
            await enforceMinimumDuration(startedAt);
            return NextResponse.json(
                { ok: false, error: 'AUTH_UNAVAILABLE' },
                { status: 503, headers: { 'Cache-Control': 'no-store' } },
            );
        }

        recordPasswordLoginSuccess(ip);
        await enforceMinimumDuration(startedAt);

        return NextResponse.json(
            { ok: true, customToken },
            { status: 200, headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (e) {
        console.error('[password-login]', e);
        try {
            recordPasswordLoginFailure(getClientIpFromHeaders(request));
        } catch {
            /* ignore */
        }
        await enforceMinimumDuration(startedAt);
        return failure401();
    }
}
