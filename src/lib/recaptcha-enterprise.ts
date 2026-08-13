/**
 * reCAPTCHA Enterprise for **BookAddis signup/login** only.
 * Site key: NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY (e.g. 6LeEZ90s…).
 *
 * Do NOT wire Firebase's managed Identity Platform key (6Le4llYs…) here.
 * Phone/MFA SMS uses that key inside the Firebase Auth SDK  no Nest assessment.
 *
 * @see https://cloud.google.com/recaptcha/docs/instrument-web-pages
 */

declare global {
    interface Window {
        grecaptcha?: {
            enterprise: {
                ready: (cb: () => void | Promise<void>) => void;
                execute: (siteKey: string, options: { action: string }) => Promise<string>;
            };
        };
    }
}

let scriptLoadPromise: Promise<void> | null = null;

export function getRecaptchaEnterpriseSiteKey(): string | undefined {
    const k = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY?.trim();
    return k || undefined;
}

function loadEnterpriseScript(siteKey: string): Promise<void> {
    if (typeof document === 'undefined') {
        return Promise.resolve();
    }
    if (scriptLoadPromise) {
        return scriptLoadPromise;
    }
    const id = 'recaptcha-enterprise-js';
    if (document.getElementById(id)) {
        return Promise.resolve();
    }

    scriptLoadPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.id = id;
        s.async = true;
        // Score-based keys need ?render=YOUR_APP_SITE_KEY for execute().
        s.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
        s.onload = () => resolve();
        s.onerror = () => {
            scriptLoadPromise = null;
            reject(new Error('Failed to load reCAPTCHA Enterprise'));
        };
        document.head.appendChild(s);
    });

    return scriptLoadPromise;
}

/**
 * Runs Enterprise assessment for the given action (e.g. login, signup).
 * Returns undefined if no site key is configured (dev / optional).
 */
export async function executeRecaptchaEnterprise(action: string): Promise<string | undefined> {
    const siteKey = getRecaptchaEnterpriseSiteKey();
    if (!siteKey || typeof window === 'undefined') {
        return undefined;
    }

    const normalized = action.trim().toLowerCase();
    if (!/^[a-z0-9_/]+$/.test(normalized)) {
        throw new Error('The requested action is invalid.');
    }

    await loadEnterpriseScript(siteKey);

    return new Promise((resolve, reject) => {
        const g = window.grecaptcha?.enterprise;
        if (!g) {
            reject(new Error('reCAPTCHA Enterprise not available'));
            return;
        }
        g.ready(async () => {
            try {
                const token = await g.execute(siteKey, { action: normalized });
                resolve(token);
            } catch (e) {
                reject(e instanceof Error ? e : new Error(String(e)));
            }
        });
    });
}
