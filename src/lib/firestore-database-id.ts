/**
 * Named Firestore DB in firebase.json is `flowaddis-db` (hyphen, not underscore).
 * Client and server must use the same id or role/admin routing reads the wrong database.
 */
export function resolveFirestoreDatabaseId(envValue: string | undefined): string {
    const raw = envValue?.trim();
    if (!raw || raw === '(default)') {
        return 'flowaddis-db';
    }
    if (raw === 'flowaddis_db') {
        return 'flowaddis-db';
    }
    return raw;
}
