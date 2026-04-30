import { APP_CONSTANTS } from '../constants';

/**
 * @deprecated Auth session must use HttpOnly cookie from `POST /api/auth/session` only.
 * Setting the Firebase ID token in `document.cookie` exposes it to XSS (INSA / cookie flags).
 * These functions are no-ops kept so any stale import does not silently reintroduce the risk.
 */
export const setAuthCookie = (_token: string): void => {
    if (process.env.NODE_ENV === 'development') {
        console.warn(
            `[${APP_CONSTANTS.AUTH.COOKIE_NAME}] setAuthCookie is disabled — use POST /api/auth/session for HttpOnly session.`,
        );
    }
};

export const clearAuthCookie = (): void => {
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[${APP_CONSTANTS.AUTH.COOKIE_NAME}] clearAuthCookie is disabled — use DELETE /api/auth/session.`);
    }
};

export const deleteAuthCookie = (): void => {
    clearAuthCookie();
};
