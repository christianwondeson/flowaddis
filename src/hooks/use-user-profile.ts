import { useQuery } from '@tanstack/react-query';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserDocSnapshotPreferServer } from '@/lib/firestore-user-doc';
import { queryKeys } from '@/lib/react-query';
import { HotelPartnerRequest, HotelPartnerStatus, User, UserRole } from '@/types/auth';
import { APP_CONSTANTS } from '@/lib/constants';
import { parseUserRole } from '@/lib/auth/admin-utils';

function parseHotelPartnerStatus(raw: unknown): HotelPartnerStatus {
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

export function useUserProfile(firebaseUser: FirebaseAuthUser | null) {
    const uid = firebaseUser?.uid ?? '';
    const isCheckoutGuest =
        Boolean(firebaseUser?.isAnonymous) || Boolean(firebaseUser?.uid.startsWith('guest_'));
    return useQuery({
        queryKey: queryKeys.user.profile(uid || '__signed_out__'),
        queryFn: async (): Promise<User | null> => {
            // Guest checkout sessions must not seed Firestore "users" profiles.
            if (
                !firebaseUser ||
                !db ||
                firebaseUser.isAnonymous ||
                firebaseUser.uid.startsWith('guest_')
            ) {
                return null;
            }

            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getUserDocSnapshotPreferServer(userDocRef);

            let role: UserRole = APP_CONSTANTS.ROLES.USER;
            let name = firebaseUser.displayName || '';
            let phone = '';
            let adminStatus: 'pending' | 'approved' | 'rejected' | 'none' = 'none';
            let hotelPartnerStatus: HotelPartnerStatus = 'none';
            let hotelPartnerRequest: HotelPartnerRequest | undefined;

            if (userDoc.exists()) {
                const userData = userDoc.data();
                role = parseUserRole(userData.role);
                name = userData.name || name;
                phone = typeof userData.phone === 'string' ? userData.phone : '';
                adminStatus = userData.adminStatus || 'none';
                hotelPartnerStatus = parseHotelPartnerStatus(userData.hotelPartnerStatus);
                if (
                    userData.hotelPartnerRequest &&
                    typeof userData.hotelPartnerRequest === 'object'
                ) {
                    const r = userData.hotelPartnerRequest as Record<string, unknown>;
                    hotelPartnerRequest = {
                        hotelName: String(r.hotelName || ''),
                        city: typeof r.city === 'string' ? r.city : undefined,
                        phone: typeof r.phone === 'string' ? r.phone : undefined,
                        message: typeof r.message === 'string' ? r.message : undefined,
                        preferredPlanCode:
                            typeof r.preferredPlanCode === 'string'
                                ? r.preferredPlanCode
                                : undefined,
                        submittedAt: r.submittedAt,
                        ...(r.kyc && typeof r.kyc === 'object'
                            ? { kyc: r.kyc as HotelPartnerRequest['kyc'] }
                            : {}),
                    };
                }

            } else {

                // Seed a user document if missing
                try {
                    const newUser = {
                        name: name || firebaseUser.email?.split('@')[0] || 'Unknown',
                        email: firebaseUser.email,
                        role: APP_CONSTANTS.ROLES.USER,
                        adminStatus: 'none',
                        hotelPartnerStatus: 'none',
                        createdAt: serverTimestamp()
                    };
                    await setDoc(userDocRef, newUser);
                } catch (err) {
                    console.error("Error seeding user document:", err);
                }
            }

            return {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                role: role,
                emailVerified: firebaseUser.emailVerified,
                name: name,
                ...(phone ? { phone } : {}),
                adminStatus: adminStatus,
                hotelPartnerStatus,
                ...(hotelPartnerRequest ? { hotelPartnerRequest } : {}),
            };
        },
        enabled: !!uid && !!db && !isCheckoutGuest,
        staleTime: 1000 * 60 * 2,
        /** Role can change server-side; avoid stale cache overwriting post-login `setQueryData`. */
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
}
