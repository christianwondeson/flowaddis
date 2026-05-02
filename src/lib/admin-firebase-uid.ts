/** Firebase Auth UID (alphanumeric, typical length 28). */
const FIREBASE_UID_RE = /^[A-Za-z0-9]{10,128}$/;

export function isLikelyFirebaseUid(uid: string): boolean {
    return FIREBASE_UID_RE.test(uid.trim());
}
