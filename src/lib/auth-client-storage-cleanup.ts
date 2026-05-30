/**
 * Clears client session keys used for auth-adjacent rate limits (not secrets).
 * HttpOnly cookies (e.g. `__session`) are cleared via `DELETE /api/auth/session`, not here.
 */

const SESSION_PREFIXES = ['bookaddis_login_guard_v1:', 'bookaddis_pwd_reset_v1:'] as const;

export function clearAuthRelatedSessionStorage(): void {
    if (typeof window === 'undefined') return;
    try {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
            const k = window.sessionStorage.key(i);
            if (!k) continue;
            if (SESSION_PREFIXES.some((p) => k.startsWith(p))) {
                window.sessionStorage.removeItem(k);
            }
        }
    } catch {
        /* quota / private mode */
    }
}
