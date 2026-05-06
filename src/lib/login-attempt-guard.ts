/**
 * Client-side lockout after repeated failed email/password sign-ins (CWE-307).
 * Complements Firebase Auth rate limits and server-side /api/auth/session throttling.
 */

const STORAGE_PREFIX = 'bookaddis_login_guard_v1:';

function key(email: string): string {
    return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

type GuardState = {
    fails: number;
    windowStart: number;
    lockUntil?: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_BEFORE_LOCKOUT = 5;
/** Lockout duration after MAX_FAILS_BEFORE_LOCKOUT failures in WINDOW_MS */
const LOCKOUT_MS = 15 * 60 * 1000;

function readState(email: string): GuardState {
    if (typeof window === 'undefined') {
        return { fails: 0, windowStart: Date.now() };
    }
    try {
        const raw = sessionStorage.getItem(key(email));
        if (!raw) return { fails: 0, windowStart: Date.now() };
        return JSON.parse(raw) as GuardState;
    } catch {
        return { fails: 0, windowStart: Date.now() };
    }
}

function writeState(email: string, s: GuardState): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(key(email), JSON.stringify(s));
    } catch {
        /* quota / private mode */
    }
}

function formatWait(seconds: number): string {
    if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} hour(s)`;
    if (seconds >= 60) return `${Math.ceil(seconds / 60)} minute(s)`;
    return `${seconds} second(s)`;
}

/**
 * Throws Error with user-facing message if sign-in is not allowed yet.
 */
export function assertEmailLoginAllowed(email: string): void {
    const now = Date.now();
    const s = readState(email);
    if (s.lockUntil != null && now < s.lockUntil) {
        const sec = Math.ceil((s.lockUntil - now) / 1000);
        throw new Error(
            `Too many sign-in attempts. Try again in ${formatWait(sec)}.`,
        );
    }
}

/** Call after a failed email/password sign-in (wrong password, user not found, etc.). */
export function recordEmailLoginFailure(email: string): void {
    const now = Date.now();
    let s = readState(email);
    if (s.lockUntil != null && now < s.lockUntil) return;
    if (now - s.windowStart > WINDOW_MS) {
        s = { fails: 0, windowStart: now };
    }
    s.fails += 1;
    if (s.fails >= MAX_FAILS_BEFORE_LOCKOUT) {
        s.lockUntil = now + LOCKOUT_MS;
        s.fails = 0;
        s.windowStart = now;
    }
    writeState(email, s);
}

/** Call after successful email/password sign-in. */
export function clearEmailLoginGuard(email: string): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.removeItem(key(email));
    } catch {
        /* ignore */
    }
}
