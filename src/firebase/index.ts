
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
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    if (process.env.NODE_ENV === 'development') {
      // Check if emulators are already connected to prevent re-connecting on hot reloads
      // @ts-ignore - _emulator.host is not in the official type definitions but it's a reliable way to check
      if (!auth.config.emulator) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      }
      // @ts-ignore
      if (!db._settings.host.includes('127.0.0.1')) {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
      }
      // @ts-ignore
      if (!storage._protocol.emulatorHost) {
        connectStorageEmulator(storage, '127.0.0.1', 9199);
      }
    }
    
    services = { app, db, auth, storage };
    return services;
}
