import { useQuery } from '@tanstack/react-query';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserDocSnapshotPreferServer } from '@/lib/firestore-user-doc';
import { queryKeys } from '@/lib/react-query';
import { User, UserRole } from '@/types/auth';
import { APP_CONSTANTS } from '@/lib/constants';

export function useUserProfile(firebaseUser: FirebaseAuthUser | null) {
    const uid = firebaseUser?.uid ?? '';
    return useQuery({
        queryKey: queryKeys.user.profile(uid || '__signed_out__'),
        queryFn: async (): Promise<User | null> => {
            if (!firebaseUser || !db) return null;

            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getUserDocSnapshotPreferServer(userDocRef);

            let role: UserRole = APP_CONSTANTS.ROLES.USER;
            let name = firebaseUser.displayName || '';
            let phone = '';
            let adminStatus: 'pending' | 'approved' | 'rejected' | 'none' = 'none';

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const rawRole = userData.role;
                if (typeof rawRole === 'string' && rawRole.toLowerCase().trim() === 'admin') {
                    role = APP_CONSTANTS.ROLES.ADMIN as UserRole;
                } else {
                    role = APP_CONSTANTS.ROLES.USER as UserRole;
                }
                name = userData.name || name;
                phone = typeof userData.phone === 'string' ? userData.phone : '';
                adminStatus = userData.adminStatus || 'none';

            } else {

                // Seed a user document if missing
                try {
                    const newUser = {
                        name: name || firebaseUser.email?.split('@')[0] || 'Unknown',
                        email: firebaseUser.email,
                        role: APP_CONSTANTS.ROLES.USER,
                        adminStatus: 'none',
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
                adminStatus: adminStatus
            };
        },
        enabled: !!uid && !!db,
        staleTime: 1000 * 60 * 2,
        /** Role can change server-side; avoid stale cache overwriting post-login `setQueryData`. */
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
}
