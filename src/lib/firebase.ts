import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
    getFirestore,
    Firestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { resolveFirestoreDatabaseId } from "@/lib/firestore-database-id";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== "undefined") {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    // Debug: log project configuration once on client
    try {
        console.info('[Firebase] Project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    } catch {}
    auth = getAuth(app);

    // Explicitly set persistence to local (default but good to be explicit)
    import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
        if (auth) setPersistence(auth, browserLocalPersistence);
    });

    // Initialize Firestore using either a named database (if provided) or the default database
    try {
        const databaseId = resolveFirestoreDatabaseId(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID);
        console.info('[Firebase] Firestore databaseId:', databaseId);
        const settings = {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        } as const;

        // Always use the named database (flowaddis-db) — see firebase.json
        db = initializeFirestore(app, settings, databaseId);
    } catch (error) {
        console.error('❌ Error initializing Firestore:', error);
        // As a last resort, attempt to get a basic Firestore instance
        db = getFirestore(app);
    }
}

// Export with fallback for server-side
export { auth, db };

// Analytics only works on the client side
export const analytics = async (): Promise<Analytics | null> => {
    if (typeof window !== "undefined" && app && (await isSupported())) {
        return getAnalytics(app);
    }
    return null;
};
