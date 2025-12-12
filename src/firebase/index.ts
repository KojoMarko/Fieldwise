'use client';
export * from './provider';
export * from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export type FirebaseServices = {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

let services: FirebaseServices | null = null;

// This function should only be called on the client side.
export function initializeFirebase(): FirebaseServices {
    if (services) {
      return services;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration is incomplete. Check your environment variables.');
    }
    
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
        // Delay emulator connection slightly to avoid race conditions
        setTimeout(() => {
            // @ts-ignore
             if (!auth.config.emulator) {
                try {
                connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
                } catch (e) {
                console.warn('Could not connect to Auth emulator:', e);
                }
            }
            // @ts-ignore
            if (!db._settings.host.includes('127.0.0.1')) {
                try {
                connectFirestoreEmulator(db, '127.0.0.1', 8080);
                } catch (e) {
                console.warn('Could not connect to Firestore emulator:', e);
                }
            }
            // @ts-ignore
            if (!storage._protocol.emulatorHost) {
                try {
                connectStorageEmulator(storage, '127.0.0.1', 9199);
                } catch (e) {
                console.warn('Could not connect to Storage emulator:', e);
                }
            }
        }, 0);
    }
    
    services = { app, db, auth, storage };
    return services;
}
