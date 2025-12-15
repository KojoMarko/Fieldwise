
'use client';
export * from './provider';
export * from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

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
    
    services = { app, db, auth, storage };
    return services;
}
