import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query';
import { User, UserRole } from '@/types/auth';
import { APP_CONSTANTS } from '@/lib/constants';

export function useUserProfile(firebaseUser: any) {
    return useQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: async (): Promise<User | null> => {
            if (!firebaseUser || !db) return null;

            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            let role: UserRole = APP_CONSTANTS.ROLES.USER;
            let name = firebaseUser.displayName || '';

            if (userDoc.exists()) {
                const userData = userDoc.data();
                role = userData.role as UserRole;
                name = userData.name || name;

               
            } else {
                
                // Seed a user document if missing
                try {
                    const newUser = {
                        name: name || firebaseUser.email?.split('@')[0] || 'Unknown',
                        email: firebaseUser.email,
                        role: APP_CONSTANTS.ROLES.USER,
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
                name: name
            };
        },
        enabled: !!firebaseUser && !!db,
        staleTime: 0, // Always fetch fresh data
        refetchOnMount: true, // Refetch when component mounts
        refetchOnWindowFocus: true, // Refetch when window regains focus
    });
}
