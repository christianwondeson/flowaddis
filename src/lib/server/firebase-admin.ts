import * as admin from 'firebase-admin';

/**
 * Normalize PEM from env / secret managers. Hosted deployments often break multiline PEM:
 * literal `\n` vs real newlines, double-escaping, BOM, missing quotes.
 */
export function normalizeFirebasePrivateKeyPem(raw: string): string | null {
    let k = raw.trim();
    // UTF-8 BOM
    if (k.charCodeAt(0) === 0xfeff) {
        k = k.slice(1).trim();
    }
    // Outer quotes (dotenv / shells)
    if (
        (k.startsWith('"') && k.endsWith('"')) ||
        (k.startsWith("'") && k.endsWith("'"))
    ) {
        k = k.slice(1, -1);
    }
    k = k.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Literal backslash-n from secret stores
    k = k.replace(/\\n/g, '\n');
    // Double-escaped (some CI JSON-in-env)
    k = k.replace(/\\\\n/g, '\n');

    if (!k.includes('BEGIN PRIVATE KEY')) {
        return null;
    }
    return k.trim();
}

/** Safe for logs — booleans only (debug 503 AUTH_UNAVAILABLE on deployed SSR). */
export function getFirebaseAdminCredentialPresence(): {
    hasProjectId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
} {
    const projectId =
        process.env.ADMIN_FIREBASE_PROJECT_ID?.trim() ||
        process.env.FIREBASE_PROJECT_ID?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
        process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        process.env.GCLOUD_PROJECT?.trim();
    const clientEmail =
        process.env.ADMIN_FIREBASE_CLIENT_EMAIL?.trim() || process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = resolvePrivateKeyFromEnv();
    return {
        hasProjectId: Boolean(projectId),
        hasClientEmail: Boolean(clientEmail),
        hasPrivateKey: Boolean(privateKey),
    };
}

function resolvePrivateKeyFromEnv(): string | null {
    const b64 =
        process.env.ADMIN_FIREBASE_PRIVATE_KEY_BASE64?.trim() ||
        process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();
    if (b64) {
        try {
            const decoded = Buffer.from(b64, 'base64').toString('utf8');
            const normalized = normalizeFirebasePrivateKeyPem(decoded);
            if (normalized) return normalized;
        } catch {
            /* ignore */
        }
    }

    const raw = process.env.ADMIN_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
    if (!raw?.trim()) {
        return null;
    }
    return normalizeFirebasePrivateKeyPem(raw);
}

/**
 * Firebase Admin for server-only flows (e.g. minting custom tokens after REST password verification).
 *
 * **Production:** Set on the host (not only in `.env` locally).
 * Use `ADMIN_FIREBASE_*` — plain `FIREBASE_*` names are rejected by Firebase Hosting framework deploy (reserved prefix).
 * - `ADMIN_FIREBASE_PROJECT_ID` or `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (legacy: `FIREBASE_PROJECT_ID`)
 * - `ADMIN_FIREBASE_CLIENT_EMAIL` (legacy: `FIREBASE_CLIENT_EMAIL`)
 * - `ADMIN_FIREBASE_PRIVATE_KEY` or `ADMIN_FIREBASE_PRIVATE_KEY_BASE64` (legacy: `FIREBASE_PRIVATE_KEY` / `_BASE64`)
 */
export function getFirebaseAdminApp(): admin.app.App | null {
    if (admin.apps.length > 0) {
        return admin.apps[0] as admin.app.App;
    }

    const projectId =
        process.env.ADMIN_FIREBASE_PROJECT_ID?.trim() ||
        process.env.FIREBASE_PROJECT_ID?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
        process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        process.env.GCLOUD_PROJECT?.trim();
    const clientEmail =
        process.env.ADMIN_FIREBASE_CLIENT_EMAIL?.trim() || process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = resolvePrivateKeyFromEnv();

    if (!projectId || !clientEmail || !privateKey) {
        if (process.env.NODE_ENV === 'production') {
            console.error(
                '[firebase-admin] Admin SDK credential incomplete (no secrets logged):',
                {
                    hasProjectId: Boolean(projectId),
                    hasClientEmail: Boolean(clientEmail),
                    hasPrivateKey: Boolean(privateKey),
                },
            );
        }
        return null;
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    } catch (e) {
        console.error('[firebase-admin] initializeApp failed (check PEM newlines / base64 secret):', e);
        /** Another concurrent request may have initialized — reuse it */
        if (admin.apps.length > 0) {
            return admin.apps[0] as admin.app.App;
        }
        return null;
    }
}

export async function createFirebaseCustomToken(uid: string): Promise<string | null> {
    const app = getFirebaseAdminApp();
    if (!app) {
        return null;
    }
    try {
        return await admin.auth(app).createCustomToken(uid);
    } catch (e) {
        console.error('[firebase-admin] createCustomToken failed:', e);
        return null;
    }
}
