"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onIdTokenChanged,

    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    User as FirebaseUser,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContextType, User, UserRole } from '@/types/auth';

// Update the type definition in the interface if it's not exported from types/auth
// Since we can't see types/auth.ts, we'll assume we need to cast or update the implementation
// But first let's check if we need to update the Context definition in this file if it exists
// It seems AuthContextType is imported. Let's assume we might need to update the interface in types/auth.ts
// But since I can't edit that file right now without reading it, I'll proceed with the implementation
// and if TypeScript complains, I'll fix it.

// Actually, I should check types/auth.ts first to be safe.

import { APP_CONSTANTS } from '@/lib/constants';
// import { setAuthCookie, clearAuthCookie, deleteAuthCookie } from '@/lib/utils/cookies'; // Deprecated in favor of HttpOnly cookies
import { useUserProfile } from '@/hooks/use-user-profile';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const queryClient = useQueryClient();
    const router = useRouter();

    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            return;
        }

        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdToken();
                // setAuthCookie(token);
                // Securely set session on server
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
                setFirebaseUser(user);
            } else {
                // clearAuthCookie();
                await fetch('/api/auth/session', { method: 'DELETE' });
                setFirebaseUser(null);
                queryClient.setQueryData(queryKeys.user.profile(), null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [queryClient]);

    const { data: userProfile, isLoading: profileLoading } = useUserProfile(firebaseUser);

    // Optimize: use useMemo to prevent recomputing on every render
    const user = useMemo(() => {
        return userProfile || (firebaseUser ? {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: APP_CONSTANTS.ROLES.USER as UserRole,
            emailVerified: firebaseUser.emailVerified,
            name: firebaseUser.displayName || ''
        } : null);
    }, [userProfile, firebaseUser]);

    const loading = authLoading || (!!firebaseUser && profileLoading);

    const login = async (email: string, password?: string): Promise<UserRole> => {
        if (!auth) throw new Error("Auth not initialized");
        if (!password) throw new Error("Password required");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        // setAuthCookie(token);
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        if (db) {
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = (userData.role as UserRole) || APP_CONSTANTS.ROLES.USER;

                // Pre-populate the query cache to avoid immediate refetch
                const userProfileData: User = {
                    id: userCredential.user.uid,
                    email: userCredential.user.email!,
                    role: role,
                    emailVerified: userCredential.user.emailVerified,
                    name: userData.name || userCredential.user.displayName || ''
                };

                queryClient.setQueryData(queryKeys.user.profile(), userProfileData);

                return role;
            }
        }
        return APP_CONSTANTS.ROLES.USER;
    };

    const register = useCallback(async (name: string, email: string, password?: string, requestAdmin?: boolean) => {
        if (!auth) throw new Error("Auth not initialized");
        if (!db) {
            console.error('❌ Firestore (db) is undefined!');
            throw new Error("Database not initialized");
        }
        if (!password) throw new Error("Password required");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Default role is user. Admin role is granted only after approval.
            const role = APP_CONSTANTS.ROLES.USER;
            const adminStatus = requestAdmin ? 'pending' : 'none';

            const userDocRef = doc(db, "users", user.uid);
            const userData = {
                name,
                email,
                role,
                adminStatus,
                createdAt: serverTimestamp()
            };

            await setDoc(userDocRef, userData);

            // Verify the document was created
            const verifyDoc = await getDoc(userDocRef);
            if (!verifyDoc.exists()) {
                console.error('❌ Warning: Document was not found after creation!');
            }
        } catch (error) {
            console.error('❌ Error in register function:', error);
            const err = error as any;
            const code: string | undefined = err?.code;
            // Provide friendlier error messages
            if (code === 'auth/email-already-in-use') {
                throw new Error('An account with this email already exists. Try signing in or use Forgot Password.');
            }
            if (code === 'auth/weak-password') {
                throw new Error('Your password is too weak. Please use at least 8 characters.');
            }
            if (code === 'auth/invalid-email') {
                throw new Error('The email address is invalid.');
            }
            // Default fallback
            throw new Error(err?.message || 'Registration failed. Please try again.');
        }
    }, []);



    const logout = async () => {
        if (!auth) throw new Error("Auth not initialized");
        await signOut(auth);
        // deleteAuthCookie();
        await fetch('/api/auth/session', { method: 'DELETE' });
        setFirebaseUser(null);
        queryClient.setQueryData(queryKeys.user.profile(), null);
    };

    const loginWithGoogle = async (): Promise<UserRole> => {
        if (!auth) throw new Error("Auth not initialized");
        if (!db) throw new Error("Firestore not initialized. Please check your Firebase configuration.");

        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        const token = await user.getIdToken();
        // setAuthCookie(token);
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                name: user.displayName || "Unknown",
                email: user.email,
                role: APP_CONSTANTS.ROLES.USER,
                createdAt: serverTimestamp()
            });
            return APP_CONSTANTS.ROLES.USER;
        } else {
            const userData = userDoc.data();
            return (userData.role as UserRole) || APP_CONSTANTS.ROLES.USER;
        }
    };

    const sendVerificationEmail = async () => {
        if (!auth?.currentUser) throw new Error("No user logged in");
        await sendEmailVerification(auth.currentUser);
    };

    const sendPasswordReset = async (email: string) => {
        if (!auth) throw new Error("Auth not initialized");
        await sendPasswordResetEmail(auth, email);
    };

    const requireAuth = () => {
        if (!user && !loading) {
            const currentPath = window.location.pathname + window.location.search;
            router.push(`${APP_CONSTANTS.AUTH.SIGNIN_PATH}?${APP_CONSTANTS.AUTH.REDIRECT_PARAM}=${encodeURIComponent(currentPath)}`);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, sendVerificationEmail, sendPasswordReset, requireAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
