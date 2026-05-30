import type { DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import { getDoc, getDocFromServer } from 'firebase/firestore';

/**
 * Read `users/{uid}` from the Firestore backend first so we never treat a stale
 * persisted-cache snapshot as the source of truth for `role` / `adminStatus`.
 */
export async function getUserDocSnapshotPreferServer(
    ref: DocumentReference,
): Promise<DocumentSnapshot> {
    try {
        return await getDocFromServer(ref);
    } catch (e: unknown) {
        const code =
            typeof e === 'object' && e !== null && 'code' in e
                ? String((e as { code?: string }).code)
                : '';
        if (code === 'unavailable' || code === 'deadline-exceeded') {
            return getDoc(ref);
        }
        throw e;
    }
}
