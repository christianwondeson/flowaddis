/**
 * reCAPTCHA Enterprise (v3-style execute) for protected actions (LOGIN, SIGNUP, etc.).
 * Site key is public; optional backend verification uses a separate secret.
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
 * Runs Enterprise assessment for the given action (e.g. LOGIN, SIGNUP).
 * Returns undefined if no site key is configured (dev / optional).
 */
export async function executeRecaptchaEnterprise(action: string): Promise<string | undefined> {
    const siteKey = getRecaptchaEnterpriseSiteKey();
    if (!siteKey || typeof window === 'undefined') {
        return undefined;
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
                const token = await g.execute(siteKey, { action });
                resolve(token);
            } catch (e) {
                reject(e instanceof Error ? e : new Error(String(e)));
            }
        });
    });
}
