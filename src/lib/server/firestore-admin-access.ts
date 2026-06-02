import {
    isApprovedFirestoreAdmin,
    normalizeFirestoreRole,
} from '@/lib/auth/firestore-admin-role';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/server/firebase-admin';

export type FirestoreAdminCheckResult =
    | { ok: true }
    | { ok: false; reason: 'not_configured' | 'read_failed' | 'not_admin' | 'missing_doc' };

/**
 * Server-only: read users/{uid} from Firestore (flowaddis-db) and apply admin rules.
 */
export async function verifyApprovedAdminFromFirestore(uid: string): Promise<FirestoreAdminCheckResult> {
    if (!isFirebaseAdminConfigured()) {
        return { ok: false, reason: 'not_configured' };
    }

    try {
        const snap = await getAdminFirestore().collection('users').doc(uid).get();
        if (!snap.exists) {
            return { ok: false, reason: 'missing_doc' };
        }
        const d = snap.data() as { role?: unknown; adminStatus?: unknown } | undefined;
        const role = normalizeFirestoreRole(d?.role);
        const adminStatus = typeof d?.adminStatus === 'string' ? d.adminStatus : undefined;
        if (!isApprovedFirestoreAdmin(role, adminStatus)) {
            return { ok: false, reason: 'not_admin' };
        }
        return { ok: true };
    } catch (err) {
        console.error('[verifyApprovedAdminFromFirestore]', (err as Error).message);
        return { ok: false, reason: 'read_failed' };
    }
}
