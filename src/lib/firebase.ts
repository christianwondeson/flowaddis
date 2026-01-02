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
    auth = getAuth(app);

    // Explicitly set persistence to local (default but good to be explicit)
    import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
        if (auth) setPersistence(auth, browserLocalPersistence);
    });

    // IMPORTANT: Connect to the named database 'flowaddis-db' instead of default
    // If you have a database named 'flowaddis-db', specify it here
    // Otherwise, it will use the default (default) database
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        }, 'flowaddis-db'); // Specify your database name here

       
    } catch (error) {
        console.error('❌ Error initializing Firestore:', error);
        // Fallback to default database if named database fails
       
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });
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
