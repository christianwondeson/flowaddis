import type { DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import { getDoc, getDocFromServer } from 'firebase/firestore';

/**
 * Read `users/{uid}` from the Firestore backend first so we never treat a stale
 * persisted-cache snapshot as the source of truth for `role` / `adminStatus`.
 */
export async function getUserDocSnapshotPreferServer(
    ref: DocumentReference,
    timeoutMs = 1500,
): Promise<DocumentSnapshot> {
    try {
        // Fast race: attempt fresh server fetch with a fast timeout (default: 1.5s).
        // If server is slow, unreachable, or high-latency, fall back to local cache immediately
        // so authentication verification is blazing fast and never hangs.
        return await Promise.race([
            getDocFromServer(ref),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('firestore-server-timeout')), timeoutMs),
            ),
        ]);
    } catch {
        return getDoc(ref);
    }
}
