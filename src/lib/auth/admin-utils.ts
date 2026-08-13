import { User } from '@/types/auth';
import type { UserRole } from '@/types/auth';
import { APP_CONSTANTS } from '@/lib/constants';
import { isHotelPortalUnlocked } from '@/lib/hotel-partner-kyc';

/**
 * Admin status constants for type safety and consistency
 */
export const ADMIN_STATUS = {
    APPROVED: 'approved',
    PENDING: 'pending',
    REJECTED: 'rejected',
    NONE: 'none',
} as const;

export type AdminStatus = typeof ADMIN_STATUS[keyof typeof ADMIN_STATUS];

/** Normalize Firestore role string into a known UserRole. */
export function parseUserRole(raw: unknown): UserRole {
    if (typeof raw !== 'string') return APP_CONSTANTS.ROLES.USER;
    const r = raw.toLowerCase().trim();
    if (r === 'admin') return APP_CONSTANTS.ROLES.ADMIN;
    if (r === 'hotel_admin') return APP_CONSTANTS.ROLES.HOTEL_ADMIN;
    if (r === 'hotel_staff') return APP_CONSTANTS.ROLES.HOTEL_STAFF;
    return APP_CONSTANTS.ROLES.USER;
}

/**
 * Type guard to check if user has platform Super Admin role
 */
export function isAdminRole(user: User | null | undefined): boolean {
    return user?.role === 'admin';
}

/** Hotel partner extranet roles only (not platform Super Admin). */
export function isHotelPortalRole(user: User | null | undefined): boolean {
    return user?.role === 'hotel_admin' || user?.role === 'hotel_staff';
}

/**
 * Type guard to check if admin status is approved
 * Treats undefined and 'none' as approved for backward compatibility
 */
export function isAdminApproved(user: User | null | undefined): boolean {
    if (!user || !isAdminRole(user)) return false;

    const status = user.adminStatus;

    // Approved statuses: 'approved', 'none', or undefined (backward compatibility)
    return (
        status === ADMIN_STATUS.APPROVED ||
        status === ADMIN_STATUS.NONE ||
        status === undefined
    );
}

/**
 * Type guard to check if admin is explicitly blocked
 */
export function isAdminBlocked(user: User | null | undefined): boolean {
    if (!user || !isAdminRole(user)) return false;

    const status = user.adminStatus;

    // Blocked statuses: 'pending' or 'rejected'
    return (
        status === ADMIN_STATUS.PENDING ||
        status === ADMIN_STATUS.REJECTED
    );
}

/**
 * Get normalized admin status with fallback
 */
export function getAdminStatus(user: User | null | undefined): AdminStatus {
    if (!user || !isAdminRole(user)) return ADMIN_STATUS.NONE;

    const status = user.adminStatus;

    // Normalize undefined to 'none' for consistency
    if (status === undefined) return ADMIN_STATUS.NONE;

    return status;
}

/**
 * Get user-friendly message for admin status
 */
export function getAdminStatusMessage(user: User | null | undefined): string {
    if (!user) return 'Not authenticated';
    if (!isAdminRole(user)) return 'Not an admin user';

    const status = getAdminStatus(user);

    switch (status) {
        case ADMIN_STATUS.APPROVED:
            return 'Admin access granted';
        case ADMIN_STATUS.PENDING:
            return 'Admin access pending approval';
        case ADMIN_STATUS.REJECTED:
            return 'Admin access has been rejected';
        case ADMIN_STATUS.NONE:
            return 'Admin access granted (legacy)';
        default:
            return 'Unknown admin status';
    }
}

/**
 * Platform Super Admin  global `/admin` console.
 */
export function canAccessSuperAdmin(user: User | null | undefined): boolean {
    return isAdminRole(user) && !isAdminBlocked(user);
}

/**
 * @deprecated Prefer `canAccessSuperAdmin`  kept for existing call sites.
 */
export function canAccessAdmin(user: User | null | undefined): boolean {
    return canAccessSuperAdmin(user);
}

/**
 * Hotel partner extranet (`/admin/hotel`)  hotel desk only.
 * Platform Super Admin manages inventory under `/admin/partners` (Hotels) instead.
 */
export function isHotelOperator(user: User | null | undefined): boolean {
    return user?.role === 'hotel_admin' || user?.role === 'hotel_staff';
}

/**
 * Hotel partner extranet (`/admin/hotel`).
 * Requires hotel_admin/hotel_staff AND not blocked by unfinished/rejected KYC.
 * Super Admin uses `/admin/partners`  not this portal.
 */
export function canAccessHotelPortal(user: User | null | undefined): boolean {
    return isHotelPortalUnlocked(user);
}
