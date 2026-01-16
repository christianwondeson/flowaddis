import { User } from '@/types/auth';

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

/**
 * Type guard to check if user has admin role
 */
export function isAdminRole(user: User | null | undefined): boolean {
    return user?.role === 'admin';
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
 * Check if user can access admin routes
 * This is the main function to use for admin access control
 */
export function canAccessAdmin(user: User | null | undefined): boolean {
    return isAdminRole(user) && !isAdminBlocked(user);
}
