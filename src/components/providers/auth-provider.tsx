"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { MultiFactorResolver } from 'firebase/auth';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onIdTokenChanged,

    GoogleAuthProvider,
    signInWithPopup,
    reauthenticateWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    User as FirebaseUser,
    ConfirmationResult,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    updateProfile,
    getMultiFactorResolver,
    multiFactor,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getUserDocSnapshotPreferServer } from '@/lib/firestore-user-doc';
import { AuthContextType, User, UserRole } from '@/types/auth';
import { toast } from 'sonner';

import { APP_CONSTANTS } from '@/lib/constants';
import { validatePasswordStrength } from '@/lib/password-policy';
// import { setAuthCookie, clearAuthCookie, deleteAuthCookie } from '@/lib/utils/cookies'; // Deprecated in favor of HttpOnly cookies
import { useUserProfile } from '@/hooks/use-user-profile';
import {
    assertEmailLoginAllowed,
    clearEmailLoginGuard,
    recordEmailLoginFailure,
} from '@/lib/login-attempt-guard';
import {
    assertPasswordResetAllowed,
    recordPasswordResetRequest,
} from '@/lib/password-reset-attempt-guard';
import { MfaSignInRequiredError } from '@/lib/mfa-sign-in-error';
import {
    getFirebaseAuthUserMessage,
    logFirebaseAuthError,
} from '@/lib/firebase-auth-user-message';
import { clearAuthRelatedSessionStorage } from '@/lib/auth-client-storage-cleanup';

async function postSessionCookie(token: string): Promise<Response> {
    return fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
}

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
                const token = await user.getIdToken(true);
                const res = await postSessionCookie(token);
                if (res.status === 429) {
                    toast.error(
                        'Too many session requests from this network. Wait a few minutes or refresh the page.',
                    );
                } else if (!res.ok) {
                    console.warn('[auth] Session cookie sync failed:', res.status);
                }
                setFirebaseUser(user);
            } else {
                // clearAuthCookie();
                await fetch('/api/auth/session', { method: 'DELETE' });
                setFirebaseUser(null);
                queryClient.removeQueries({ queryKey: queryKeys.user.all });
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

    const { data: userProfile, isLoading: profileLoading } = useUserProfile(firebaseUser);

    // Optimize: use useMemo to prevent recomputing on every render
    const user = useMemo(() => {
        if (!firebaseUser) return null;
        const uid = firebaseUser.uid;
        const profileKey = queryKeys.user.profile(uid);
        const fromCache = queryClient.getQueryData<User>(profileKey);
        const resolved =
            fromCache?.id === uid ? fromCache : userProfile?.id === uid ? userProfile : undefined;
        return (
            resolved ?? {
                id: uid,
                email: firebaseUser.email!,
                role: APP_CONSTANTS.ROLES.USER as UserRole,
                emailVerified: firebaseUser.emailVerified,
                name: firebaseUser.displayName || '',
            }
        );
    }, [userProfile, firebaseUser, queryClient]);

    const loading = authLoading || (!!firebaseUser && profileLoading);

    /**
     * Wait for the user state to update with the expected role.
     * This prevents race conditions where navigation occurs before state is synchronized.
     * @param expectedRole - The role we expect the user to have
     * @param timeoutMs - Maximum time to wait (default 5000ms)
     * @returns Promise that resolves when user state matches expected role or timeout occurs
     */
    const waitForUserUpdate = useCallback(
        async (uid: string, expectedRole: UserRole, timeoutMs: number = 2000): Promise<void> => {
            const startTime = Date.now();
            const pollInterval = 16;
            const norm = (r: string | undefined) => String(r ?? '').toLowerCase().trim();

            return new Promise((resolve) => {
                const checkUser = () => {
                    const currentUser = queryClient.getQueryData<User>(queryKeys.user.profile(uid));
                    if (norm(currentUser?.role) === norm(expectedRole)) {
                        resolve();
                        return;
                    }
                    if (Date.now() - startTime >= timeoutMs) {
                        resolve();
                        return;
                    }
                    setTimeout(checkUser, pollInterval);
                };
                // React Query updates are synchronous for setQueryData, but allow one frame for subscribers
                queueMicrotask(() => checkUser());
            });
        },
        [queryClient],
    );

    const completeLoginAfterUser = useCallback(
        async (firebaseUser: FirebaseUser, loginEmail?: string): Promise<UserRole> => {
            if (loginEmail) clearEmailLoginGuard(loginEmail);
            const token = await firebaseUser.getIdToken();
            const sessRes = await postSessionCookie(token);
            if (sessRes.status === 429) {
                await signOut(auth!);
                throw new Error(
                    'Too many authentication attempts from this network. Please wait and try again.',
                );
            }
            if (!sessRes.ok) {
                await signOut(auth!);
                throw new Error('Could not complete sign-in securely. Please try again.');
            }

            if (db) {
                try {
                    await queryClient.cancelQueries({
                        queryKey: queryKeys.user.profile(firebaseUser.uid),
                    });
                    const userDoc = await getUserDocSnapshotPreferServer(
                        doc(db, 'users', firebaseUser.uid),
                    );
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const rawRole = userData.role;
                        const role: UserRole =
                            typeof rawRole === 'string' && rawRole.toLowerCase().trim() === 'admin'
                                ? APP_CONSTANTS.ROLES.ADMIN
                                : APP_CONSTANTS.ROLES.USER;

                        const userProfileData: User = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email!,
                            role,
                            emailVerified: firebaseUser.emailVerified,
                            name: userData.name || firebaseUser.displayName || '',
                            adminStatus: userData.adminStatus || 'none',
                        };

                        queryClient.setQueryData(queryKeys.user.profile(firebaseUser.uid), userProfileData);
                        await waitForUserUpdate(firebaseUser.uid, role, 2000);
                        return role;
                    }
                } catch (e: unknown) {
                    logFirebaseAuthError('completeLoginAfterUser.firestore', e);
                    const code =
                        typeof e === 'object' && e !== null && 'code' in e
                            ? String((e as { code?: string }).code)
                            : '';
                    /** Rules/network: still signed in with Firebase Auth — avoid generic toast + blocked redirect */
                    if (
                        code === 'permission-denied' ||
                        code === 'unavailable' ||
                        code === 'failed-precondition'
                    ) {
                        const fallback: User = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email!,
                            role: APP_CONSTANTS.ROLES.USER,
                            emailVerified: firebaseUser.emailVerified,
                            name: firebaseUser.displayName || '',
                            adminStatus: 'none',
                        };
                        queryClient.setQueryData(queryKeys.user.profile(firebaseUser.uid), fallback);
                        return APP_CONSTANTS.ROLES.USER;
                    }
                    throw new Error(getFirebaseAuthUserMessage(e, 'completeLoginAfterUser'));
                }
            }
            return APP_CONSTANTS.ROLES.USER;
        },
        [auth, db, queryClient, waitForUserUpdate],
    );

    const login = async (email: string, password?: string): Promise<UserRole> => {
        if (!auth) throw new Error('Auth not initialized');
        if (!password) throw new Error('Password required');

        assertEmailLoginAllowed(email);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return await completeLoginAfterUser(userCredential.user, email);
        } catch (error: unknown) {
            const code =
                typeof error === 'object' && error && 'code' in error
                    ? String((error as { code?: string }).code)
                    : '';
            if (code === 'auth/multi-factor-auth-required' && auth) {
                const resolver = getMultiFactorResolver(auth, error as never);
                throw new MfaSignInRequiredError(resolver, email);
            }
            if (
                code === 'auth/wrong-password' ||
                code === 'auth/user-not-found' ||
                code === 'auth/invalid-credential'
            ) {
                recordEmailLoginFailure(email);
            }
            throw new Error(getFirebaseAuthUserMessage(error, 'login'));
        }
    };

    const register = useCallback(async (name: string, email: string, password?: string, requestAdmin?: boolean) => {
        if (!auth) throw new Error("Auth not initialized");
        if (!db) {
            console.error('❌ Firestore (db) is undefined!');
            throw new Error("Database not initialized");
        }
        if (!password) throw new Error("Password required");

        const pwCheck = validatePasswordStrength(password);
        if (!pwCheck.ok) {
            throw new Error(pwCheck.message);
        }

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
            throw new Error(getFirebaseAuthUserMessage(error, 'register'));
        }
    }, [auth, db, queryClient]);


    const loginWithGoogle = async (): Promise<UserRole> => {
        if (!auth) throw new Error("Auth not initialized");
        if (!db) throw new Error("Firestore not initialized. Please check your Firebase configuration.");

        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            return await completeLoginAfterUser(userCredential.user);
        } catch (error: unknown) {
            const code =
                typeof error === 'object' && error && 'code' in error
                    ? String((error as { code?: string }).code)
                    : '';
            if (code === 'auth/multi-factor-auth-required' && auth) {
                const resolver = getMultiFactorResolver(auth, error as never);
                throw new MfaSignInRequiredError(resolver);
            }
            throw new Error(getFirebaseAuthUserMessage(error, 'loginWithGoogle'));
        }
    };

    const sendSmsForMfaSignIn = useCallback(
        async (
            resolver: MultiFactorResolver,
            hintIndex: number,
            recaptchaVerifier: RecaptchaVerifier,
        ): Promise<string> => {
            if (!auth) throw new Error('Auth not initialized');
            const hint = resolver.hints[hintIndex];
            if (!hint || hint.factorId !== PhoneMultiFactorGenerator.FACTOR_ID) {
                throw new Error('SMS verification is not available for this account.');
            }
            const phoneAuthProvider = new PhoneAuthProvider(auth);
            return phoneAuthProvider.verifyPhoneNumber(
                { multiFactorHint: hint, session: resolver.session },
                recaptchaVerifier,
            );
        },
        [auth],
    );

    const completeSmsMfaSignIn = useCallback(
        async (
            resolver: MultiFactorResolver,
            verificationId: string,
            smsCode: string,
            emailForRateLimitGuard?: string,
        ): Promise<UserRole> => {
            if (!auth) throw new Error('Auth not initialized');
            const cred = PhoneAuthProvider.credential(verificationId, smsCode.trim());
            const assertion = PhoneMultiFactorGenerator.assertion(cred);
            const userCred = await resolver.resolveSignIn(assertion);
            return completeLoginAfterUser(userCred.user, emailForRateLimitGuard);
        },
        [auth, completeLoginAfterUser],
    );

    const reauthenticateForMfaEnrollment = useCallback(
        async (password?: string) => {
            if (!auth?.currentUser) throw new Error('Not signed in');
            const u = auth.currentUser;
            const hasPwd = u.providerData.some((p) => p.providerId === 'password');
            if (hasPwd) {
                const email = u.email;
                if (!email) throw new Error('No email on account');
                if (!password?.trim()) throw new Error('Enter your password to continue');
                await reauthenticateWithCredential(u, EmailAuthProvider.credential(email, password));
                return;
            }
            const gp = new GoogleAuthProvider();
            await reauthenticateWithPopup(u, gp);
        },
        [auth],
    );

    const sendMfaEnrollmentSms = useCallback(
        async (e164Phone: string, recaptchaVerifier: RecaptchaVerifier): Promise<string> => {
            if (!auth?.currentUser) throw new Error('Not signed in');
            const session = await multiFactor(auth.currentUser).getSession();
            const phoneAuthProvider = new PhoneAuthProvider(auth);
            return phoneAuthProvider.verifyPhoneNumber(
                { phoneNumber: e164Phone.trim(), session },
                recaptchaVerifier,
            );
        },
        [auth],
    );

    const completeMfaEnrollment = useCallback(
        async (verificationId: string, smsCode: string, displayName = 'Mobile phone') => {
            if (!auth?.currentUser) throw new Error('Not signed in');
            const cred = PhoneAuthProvider.credential(verificationId, smsCode.trim());
            const assertion = PhoneMultiFactorGenerator.assertion(cred);
            await multiFactor(auth.currentUser).enroll(assertion, displayName);
            toast.success('Two-factor authentication is enabled for your account.');
            await queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
        },
        [auth, queryClient],
    );

    const sendVerificationEmail = async () => {
        if (!auth?.currentUser) throw new Error("No user logged in");
        await sendEmailVerification(auth.currentUser);
    };

    const sendPasswordReset = async (email: string) => {
        if (!auth) throw new Error("Auth not initialized");
        assertPasswordResetAllowed(email);
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            if (origin) {
                await sendPasswordResetEmail(auth, email, {
                    url: `${origin}/reset-password`,
                    handleCodeInApp: false,
                });
            } else {
                await sendPasswordResetEmail(auth, email);
            }
            recordPasswordResetRequest(email);
        } catch (error) {
            throw new Error(getFirebaseAuthUserMessage(error, 'sendPasswordReset'));
        }
    };

    const changePassword = useCallback(
        async (currentPassword: string, newPassword: string) => {
            if (!auth?.currentUser) throw new Error('Not signed in');
            const u = auth.currentUser;
            const email = u.email;
            if (!email) throw new Error('No email on this account');

            const hasPasswordProvider = u.providerData.some((p) => p.providerId === 'password');
            if (!hasPasswordProvider) {
                throw new Error(
                    'Password change is only available for email/password accounts. For Google sign-in, use your Google account security settings.',
                );
            }

            const pwCheck = validatePasswordStrength(newPassword);
            if (!pwCheck.ok) {
                throw new Error(pwCheck.message);
            }

            try {
                const credential = EmailAuthProvider.credential(email, currentPassword);
                await reauthenticateWithCredential(u, credential);
                await updatePassword(u, newPassword);
                toast.success('Password updated successfully');
                await queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
            } catch (error) {
                throw new Error(getFirebaseAuthUserMessage(error, 'changePassword'));
            }
        },
        [auth, queryClient],
    );

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

    const logout = useCallback(async () => {
        if (!auth) throw new Error('Auth not initialized');
        clearRecaptcha();
        clearAuthRelatedSessionStorage();
        await signOut(auth);
        await fetch('/api/auth/session', { method: 'DELETE' });
        setFirebaseUser(null);
        queryClient.removeQueries({ queryKey: queryKeys.user.all });
    }, [auth, clearRecaptcha, queryClient]);

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
        user, // Use the memoized user which includes the fallback
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        sendSmsForMfaSignIn,
        completeSmsMfaSignIn,
        reauthenticateForMfaEnrollment,
        sendMfaEnrollmentSms,
        completeMfaEnrollment,
        sendVerificationEmail,
        sendPasswordReset,
        changePassword,
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
