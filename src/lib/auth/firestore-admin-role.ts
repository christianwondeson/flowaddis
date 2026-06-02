/**
 * Shared admin rules — must match flowaddis-api RolesGuard and firestore.rules.
 */
export function isApprovedFirestoreAdmin(
    role: string | undefined,
    adminStatus: string | undefined,
): boolean {
    if (role !== 'admin') {
        return false;
    }
    const s = adminStatus;
    if (s === 'pending' || s === 'rejected') {
        return false;
    }
    return true;
}

export function normalizeFirestoreRole(raw: unknown): string | undefined {
    if (typeof raw !== 'string') {
        return undefined;
    }
    const t = raw.toLowerCase().trim();
    return t === 'admin' ? 'admin' : t === 'user' ? 'user' : raw.trim();
}
