/**
 * Pure auth helpers (no React). Prefer importing from here for role/status parsing
 * and session cleanup so AuthProvider stays focused on session state.
 */
export { parseUserRole } from '@/lib/auth/admin-utils';
export {
  canAccessSuperAdmin,
  canAccessAdmin,
  canAccessHotelPortal,
  isHotelPortalRole,
  isHotelOperator,
  isAdminRole,
  isAdminApproved,
  isAdminBlocked,
  getAdminStatus,
  getAdminStatusMessage,
  ADMIN_STATUS,
  type AdminStatus,
} from '@/lib/auth/admin-utils';
export { clearAuthRelatedSessionStorage } from '@/lib/auth-client-storage-cleanup';
export {
  getPostLoginPath,
  getPostAuthPath,
  buildSignInHref,
  buildAuthContinueHref,
  shouldHonorPostLoginRedirect,
} from '@/lib/auth/post-login-path';

import type { HotelPartnerStatus } from '@/types/auth';

/** Normalize Firestore hotelPartnerStatus into a known enum value. */
export function parseHotelPartnerStatus(raw: unknown): HotelPartnerStatus {
  if (
    raw === 'pending' ||
    raw === 'approved' ||
    raw === 'rejected' ||
    raw === 'none' ||
    raw === 'draft'
  ) {
    return raw;
  }
  return 'none';
}
