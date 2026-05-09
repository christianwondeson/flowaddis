import * as admin from 'firebase-admin';

let initAttempted = false;

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
        return null;
    }

    const privateKey = rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n').trim();

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    } catch (e) {
        console.error('[firebase-admin] initializeApp failed:', e);
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
