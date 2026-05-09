import * as admin from 'firebase-admin';

let initAttempted = false;

/**
 * Normalizes a service account PEM stored in .env (quoted, `\n` escapes, stray CRLF).
 */
export function normalizeFirebasePrivateKey(raw: string): string {
    let k = raw.trim();
    // Strip matching outer quotes (dotenv may include them)
    while (
        (k.startsWith('"') && k.endsWith('"')) ||
        (k.startsWith("'") && k.endsWith("'"))
    ) {
        k = k.slice(1, -1).trim();
    }
    // Typical .env format: one line with literal \n sequences
    k = k.replace(/\\n/g, '\n');
    k = k.replace(/\r\n/g, '\n');
    k = k.replace(/\r/g, '\n');
    return k.trim();
}

/**
 * Firebase Admin for server-only flows (e.g. minting custom tokens after REST password verification).
 * Requires FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */
export function getFirebaseAdminApp(): admin.app.App | null {
    if (admin.apps.length > 0) {
        return admin.apps[0] as admin.app.App;
    }
    if (initAttempted) {
        return null;
    }
    initAttempted = true;

    const projectId =
        process.env.FIREBASE_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey?.trim()) {
        initAttempted = false;
        return null;
    }

    const privateKey = normalizeFirebasePrivateKey(rawKey);

    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        console.error(
            '[firebase-admin] FIREBASE_PRIVATE_KEY must contain -----BEGIN PRIVATE KEY----- after normalization. Use one line in .env with \\n for newlines.',
        );
        initAttempted = false;
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
        console.error(
            '[firebase-admin] initializeApp failed (check FIREBASE_PRIVATE_KEY is the full PEM from the service account JSON, one line with \\n):',
            e,
        );
        initAttempted = false;
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
