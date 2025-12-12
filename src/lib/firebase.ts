
'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "studio-7671175170-dc56a",
  "appId": "1:366529567590:web:17f7b26be8f46d86c386a7",
  "storageBucket": "studio-7671175170-dc56a.appspot.com",
  "apiKey": "AIzaSyDXMwRlSYKM03z2XatKzOmT9ZnkFDOtBvo",
  "authDomain": "studio-7671175170-dc56a.firebaseapp.com",
  "messagingSenderId": "366529567590"
};

type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    storage: FirebaseStorage;
};

let services: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
    if (services) {
        return services;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    if (process.env.NODE_ENV === 'development') {
        // Connect to emulators
        try {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
            connectStorageEmulator(storage, '127.0.0.1', 9199);
        } catch (error) {
            // This can happen with Next.js fast refresh.
            // It's usually safe to ignore, but we log it for debugging.
            console.warn('Firebase emulators already connected or connection failed:', error);
        }
    }
    
    services = { app, auth, db, storage };
    return services;
}

// Initialize and export the services immediately
const { app, auth, db, storage } = initializeFirebase();
export { app, auth, db, storage };
