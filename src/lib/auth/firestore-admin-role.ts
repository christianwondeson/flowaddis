/**
 * Shared admin rules  must match flowaddis-api RolesGuard and firestore.rules.
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
    if (t === 'admin') return 'admin';
    if (t === 'hotel_admin') return 'hotel_admin';
    if (t === 'hotel_staff') return 'hotel_staff';
    if (t === 'user') return 'user';
    return raw.trim();
}

/** Hotel extranet operators (+ platform Super Admin). */
export function isHotelPortalFirestoreRole(role: string | undefined): boolean {
    return (
        role === 'admin' ||
        role === 'hotel_admin' ||
        role === 'hotel_staff'
    );
}
