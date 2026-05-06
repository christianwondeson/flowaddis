/**
 * In-memory throttling for POST /api/auth/session (CWE-307 / excessive auth attempts).
 * Counts only failed ID-token verification; successful logins clear the failure streak for the IP.
 * For multi-instance hosting, replace with Redis/Upstash (same key schema).
 */

type Entry = {
    /** Timestamps of failed verifications in the rolling window */
    fails: number[];
    /** HTTP 429 block until (epoch ms) */
    blockedUntil?: number;
};

const WINDOW_MS = 10 * 60 * 1000;
/** Invalid tokens before temporary IP block */
const MAX_FAILS_IN_WINDOW = 25;
const BLOCK_MS = 30 * 60 * 1000;

const failStore = new Map<string, Entry>();

function pruneFails(ts: number[]): number[] {
    const cutoff = Date.now() - WINDOW_MS;
    return ts.filter((t) => t > cutoff);
}

export function getClientIpFromHeaders(request: Request): string {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0]?.trim();
        if (first) return first;
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return 'unknown';
}

export function isAuthSessionIpBlocked(ip: string): { blocked: boolean; retryAfterSec?: number } {
    const e = failStore.get(ip);
    if (e?.blockedUntil && Date.now() < e.blockedUntil) {
        return {
            blocked: true,
            retryAfterSec: Math.max(1, Math.ceil((e.blockedUntil - Date.now()) / 1000)),
        };
    }
    return { blocked: false };
}

/** Call when verifyFirebaseIdToken throws (invalid/expired token). */
export function recordSessionVerificationFailure(ip: string): void {
    let e = failStore.get(ip) ?? { fails: [] };
    e.fails = pruneFails(e.fails);
    e.fails.push(Date.now());
    if (e.fails.length >= MAX_FAILS_IN_WINDOW) {
        e.blockedUntil = Date.now() + BLOCK_MS;
        e.fails = [];
    }
    failStore.set(ip, e);
}

/** Call after successful token verification. */
export function recordSessionVerificationSuccess(ip: string): void {
    failStore.delete(ip);
}
