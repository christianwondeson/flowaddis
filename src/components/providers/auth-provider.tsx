"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    RecaptchaVerifier,
    signInWithPhoneNumber,
    User as FirebaseUser,
    ConfirmationResult,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContextType, User, UserRole } from '@/types/auth';
import { toast } from 'sonner';

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

declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier | undefined;
        confirmationResult: ConfirmationResult | undefined;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const queryClient = useQueryClient();
    const router = useRouter();
    const isRenderingRef = useRef<boolean>(false);
    const currentContainerIdRef = useRef<string | null>(null);
    const verifierRef = useRef<RecaptchaVerifier | null>(null);
    const renderPromiseRef = useRef<Promise<void> | null>(null);
    const requestIdRef = useRef<number>(0);

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

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = undefined;
            }
            unsubscribe();
        };
    }, [queryClient]);

    const handleAuthError = (error: any): string => {
        const code = error?.code;
        // console.error(`Auth Error [${code}]:`, error);

        switch (code) {
            // Sign In / General
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                return 'Invalid email or password. Please check your credentials and try again.';
            case 'auth/user-disabled':
                return 'This account has been disabled. Please contact support for assistance.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please wait a few minutes before trying again.';
            case 'auth/network-request-failed':
                return 'Network connection error. Please check your internet and try again.';

            // Sign Up
            case 'auth/email-already-in-use':
                return 'An account with this email already exists. Try signing in instead.';
            case 'auth/weak-password':
                return 'Your password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/operation-not-allowed':
                return 'Email/password sign-in is currently disabled. Please contact support.';

            // Password Reset
            case 'auth/expired-action-code':
                return 'The reset link has expired. Please request a new one.';
            case 'auth/invalid-action-code':
                return 'The reset link is invalid or has already been used.';

            // reCAPTCHA
            case 'auth/captcha-check-failed':
                return 'Verification failed. Please solve the reCAPTCHA again.';

            default:
                // Return a generic user-facing message but log the technical detail
                return error?.message || 'An unexpected authentication error occurred. Please try again.';
        }
    };

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

        try {
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
        } catch (error) {
            throw new Error(handleAuthError(error));
        }
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
            throw new Error(handleAuthError(error));
        }
    }, [auth, db, queryClient]);



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
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            throw new Error(handleAuthError(error));
        }
    };

    const requireAuth = () => {
        if (!user && !loading) {
            const currentPath = window.location.pathname + window.location.search;
            router.push(`${APP_CONSTANTS.AUTH.SIGNIN_PATH}?${APP_CONSTANTS.AUTH.REDIRECT_PARAM}=${encodeURIComponent(currentPath)}`);
        }
    };

    const clearRecaptcha = useCallback(() => {
        if (typeof window === 'undefined') return;

        // Increment Request ID to invalidate any in-flight renders
        requestIdRef.current += 1;

        if (verifierRef.current) {
            try {
                verifierRef.current.clear();
            } catch (e) {
                // console.warn('Error clearing verifier ref:', e);
            }
            verifierRef.current = null;
        }

        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                // console.warn('Error clearing global verifier:', e);
            }
            window.recaptchaVerifier = undefined;
        }

        if (currentContainerIdRef.current) {
            const element = document.getElementById(currentContainerIdRef.current);
            if (element) {
                element.innerHTML = '';
            }
            currentContainerIdRef.current = null;
        }

        isRenderingRef.current = false;
        renderPromiseRef.current = null;
    }, []);

    const renderRecaptcha = useCallback(async (containerId: string = 'recaptcha-container', size: 'invisible' | 'normal' = 'invisible', onSolved?: () => void) => {
        if (!auth || typeof window === 'undefined') return;

        // 1. Mark this specific call with a new ID
        const myRequestId = ++requestIdRef.current;

        // 2. Small delay to allow any unmount cleanups to process
        await new Promise(resolve => setTimeout(resolve, 0));

        // 3. If a newer request already started during our delay, bail
        if (myRequestId !== requestIdRef.current) return;

        const element = document.getElementById(containerId);
        if (!element) return;

        // 4. Return existing promise if we're already rendering this container
        if (renderPromiseRef.current && currentContainerIdRef.current === containerId) {
            return renderPromiseRef.current;
        }

        // 5. If we're rendering something else, clear it first
        if (currentContainerIdRef.current && currentContainerIdRef.current !== containerId) {
            clearRecaptcha();
            // Be sure to update myRequestId as clearRecaptcha increments it
            requestIdRef.current = myRequestId;
        }

        const renderTask = (async () => {
            isRenderingRef.current = true;
            currentContainerIdRef.current = containerId;

            try {
                // Final safety check before new initialization
                if (myRequestId !== requestIdRef.current) return;

                if (element.hasChildNodes() && verifierRef.current) {
                    verifierRef.current.clear();
                    element.innerHTML = '';
                }

                // Final safety clear
                element.innerHTML = '';

                const verifier = new RecaptchaVerifier(auth, containerId, {
                    size: size,
                    callback: (token: string) => {
                        if (onSolved) onSolved();
                    },
                    'expired-callback': () => {
                        // console.warn('reCAPTCHA expired');
                    }
                });

                // Double check if we were cleared during constructor
                if (myRequestId !== requestIdRef.current) {
                    try { verifier.clear(); } catch (e) { }
                    return;
                }

                verifierRef.current = verifier;
                window.recaptchaVerifier = verifier;

                await verifier.render();

                // console.info(`reCAPTCHA rendered successfully in #${containerId}`);
            } catch (error) {
                console.error('Error rendering reCAPTCHA:', error);
                if (myRequestId === requestIdRef.current) {
                    isRenderingRef.current = false;
                    currentContainerIdRef.current = null;
                    verifierRef.current = null;
                }
                throw error;
            } finally {
                if (myRequestId === requestIdRef.current) {
                    renderPromiseRef.current = null;
                }
            }
        })();

        renderPromiseRef.current = renderTask;
        return renderTask;
    }, [auth, clearRecaptcha]);

    // Obsolete: Phone auth removed
    const sendOtp = async (phoneNumber: string) => {
        throw new Error("Phone authentication is currently disabled.");
    };

    const value: AuthContextType = {
        user: userProfile || null,
        loading: authLoading || (!!firebaseUser && profileLoading),
        login,
        register,
        logout,
        loginWithGoogle,
        sendVerificationEmail,
        sendPasswordReset,
        requireAuth,
        renderRecaptcha,
        clearRecaptcha
    };

    return (
        <AuthContext.Provider value={value}>
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
