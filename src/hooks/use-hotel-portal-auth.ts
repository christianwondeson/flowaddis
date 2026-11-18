'use client';

import { useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  canAccessHotelPortal,
  isHotelPortalRole,
  parseHotelPartnerStatus,
} from '@/lib/auth-helpers';
import { isHotelPortalUnlocked } from '@/lib/hotel-partner-kyc';
import type { HotelPartnerStatus, User } from '@/types/auth';

export type HotelPortalAuthState = {
  user: User | null;
  loading: boolean;
  /** True when role is hotel_admin / hotel_staff. */
  isHotelRole: boolean;
  /** True when KYC/partner gates allow extranet access. */
  canAccessPortal: boolean;
  /** Normalized partner application status. */
  partnerStatus: HotelPartnerStatus;
  /** Alias for canAccessPortal (unlocked after approval). */
  portalUnlocked: boolean;
};

/**
 * Hotel-portal–specific view of auth. Keeps useAuth() generic for session/login.
 */
export function useHotelPortalAuth(): HotelPortalAuthState {
  const { user, loading } = useAuth();

  return useMemo(() => {
    const partnerStatus = parseHotelPartnerStatus(user?.hotelPartnerStatus);
    const isHotelRole = isHotelPortalRole(user);
    const canAccessPortal = canAccessHotelPortal(user);
    const portalUnlocked = isHotelPortalUnlocked(user);

    return {
      user,
      loading,
      isHotelRole,
      canAccessPortal,
      partnerStatus,
      portalUnlocked,
    };
  }, [user, loading]);
}
