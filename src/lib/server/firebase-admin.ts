import * as admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: admin.app.App | undefined;
let firestoreDb: Firestore | undefined;

function normalizePrivateKeyPem(raw: string): string | null {
    let k = raw.trim();
    if (
        (k.startsWith('"') && k.endsWith('"')) ||
        (k.startsWith("'") && k.endsWith("'"))
    ) {
        k = k.slice(1, -1);
    }
    k = k.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\\n/g, '\n');
    if (!k.includes('BEGIN PRIVATE KEY')) {
        return null;
    }
    return k.trim();
}

/** Named DB in firebase.json is `flowaddis-db` (hyphen). */
export function getFirestoreDatabaseId(): string {
    const raw = process.env.FIRESTORE_DATABASE_ID?.trim() || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID?.trim();
    if (!raw || raw === '(default)') {
        return 'flowaddis-db';
    }
    if (raw === 'flowaddis_db') {
        return 'flowaddis-db';
    }
    return raw;
}

function getAdminApp(): admin.app.App {
    if (app) {
        return app;
    }
    if (admin.apps.length > 0) {
        app = admin.apps[0]!;
        return app;
    }

    const projectId =
        process.env.ADMIN_FIREBASE_PROJECT_ID?.trim() ||
        process.env.FIREBASE_PROJECT_ID?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const clientEmail =
        process.env.ADMIN_FIREBASE_CLIENT_EMAIL?.trim() || process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKeyRaw = process.env.ADMIN_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = privateKeyRaw ? normalizePrivateKeyPem(privateKeyRaw) : null;

    if (projectId && clientEmail && privateKey) {
        app = admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        return app;
    }

    throw new Error(
        'Firebase Admin is not configured on the Next server (ADMIN_FIREBASE_PROJECT_ID, ADMIN_FIREBASE_CLIENT_EMAIL, ADMIN_FIREBASE_PRIVATE_KEY).',
    );
}

export function getAdminFirestore(): Firestore {
    if (firestoreDb) {
        return firestoreDb;
    }
    const dbId = getFirestoreDatabaseId();
    firestoreDb = getFirestore(getAdminApp(), dbId);
    return firestoreDb;
}

export function isFirebaseAdminConfigured(): boolean {
    try {
        getAdminApp();
        return true;
    } catch {
        return false;
    }
}
