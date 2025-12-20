"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendSignInLinkToEmail,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface User {
    id: string;
    email: string;
    role: 'admin' | 'user';
    emailVerified: boolean;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    register: (name: string, email: string, password?: string) => Promise<void>;
    sendMagicLink: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Set cookie for middleware
                    const token = await firebaseUser.getIdToken();
                    document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Strict`;

                    if (!db) {
                        // If db is not available, use basic user info
                        setUser({
                            id: firebaseUser.uid,
                            email: firebaseUser.email!,
                            role: 'user',
                            emailVerified: firebaseUser.emailVerified,
                            name: firebaseUser.displayName || ''
                        });
                        setLoading(false);
                        return;
                    }

                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    let role: 'admin' | 'user' = 'user';
                    let name = firebaseUser.displayName || '';

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        role = userData.role as 'admin' | 'user';
                        name = userData.name || name;
                    }

                    setUser({
                        id: firebaseUser.uid,
                        email: firebaseUser.email!,
                        role: role,
                        emailVerified: firebaseUser.emailVerified,
                        name: name
                    });
                } catch (e) {
                    console.error("Error fetching user role", e);
                    setUser({
                        id: firebaseUser.uid,
                        email: firebaseUser.email!,
                        role: 'user',
                        emailVerified: firebaseUser.emailVerified,
                        name: firebaseUser.displayName || ''
                    });
                }
            } else {
                // Clear cookie
                document.cookie = `auth-token=; path=/; max-age=0; SameSite=Strict`;
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password?: string) => {
        if (!auth) throw new Error("Auth not initialized");
        if (!password) throw new Error("Password required");
        await signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (name: string, email: string, password?: string) => {
        if (!auth) throw new Error("Auth not initialized");
        if (!db) throw new Error("Database not initialized");
        if (!password) throw new Error("Password required");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            name,
            email,
            role: 'user',
            createdAt: new Date().toISOString()
        });
    };

    const sendMagicLink = async (email: string) => {
        if (!auth) throw new Error("Auth not initialized");

        const actionCodeSettings = {
            url: window.location.origin + '/finishSignUp',
            handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
    };

    const logout = async () => {
        if (!auth) throw new Error("Auth not initialized");
        await signOut(auth);
        setUser(null);
    };

    const loginWithGoogle = async () => {
        if (!auth) throw new Error("Auth not initialized");
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const sendVerificationEmail = async () => {
        if (!auth?.currentUser) throw new Error("No user logged in");
        await sendEmailVerification(auth.currentUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, sendMagicLink, logout, loginWithGoogle, sendVerificationEmail }}>
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
