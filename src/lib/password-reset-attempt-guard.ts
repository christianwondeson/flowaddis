/**
 * Limits password-reset email requests per address (CWE-307 / enumeration & abuse).
 */

const STORAGE_PREFIX = 'bookaddis_pwd_reset_v1:';
const MAX_SENDS = 4;
const WINDOW_MS = 60 * 60 * 1000;

function key(email: string): string {
    return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

export function assertPasswordResetAllowed(email: string): void {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    try {
        const raw = sessionStorage.getItem(key(email));
        const stamps: number[] = raw ? JSON.parse(raw) : [];
        const recent = stamps.filter((t) => now - t < WINDOW_MS);
        if (recent.length >= MAX_SENDS) {
            throw new Error(
                'Too many reset requests for this email. Please wait about an hour before trying again.',
            );
        }
    } catch (e) {
        if (e instanceof Error && e.message.startsWith('Too many')) throw e;
    }
}

export function recordPasswordResetRequest(email: string): void {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    try {
        const raw = sessionStorage.getItem(key(email));
        const stamps: number[] = raw ? JSON.parse(raw) : [];
        const recent = stamps.filter((t) => now - t < WINDOW_MS);
        recent.push(now);
        sessionStorage.setItem(key(email), JSON.stringify(recent));
    } catch {
        /* ignore */
    }
}
