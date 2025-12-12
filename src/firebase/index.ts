
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
  "projectId": "studio-7671175170-dc56a",
  "appId": "1:366529567590:web:17f7b26be8f46d86c386a7",
  "storageBucket": "studio-7671175170-dc56a.appspot.com",
  "apiKey": "AIzaSyDXMwRlSYKM03z2XatKzOmT9ZnkFDOtBvo",
  "authDomain": "studio-7671175170-dc56a.firebaseapp.com",
  "messagingSenderId": "366529567590"
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
    if (services && getApps().length > 0) {
      return services;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    // This block will only run in development, and it will only try to connect once.
    if (process.env.NODE_ENV === 'development') {
      // It's safe to call these on every app initialization in development.
      // The emulator connection is only established once.
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
    }
    
    services = { app, db, auth, storage };
    return services;
}
