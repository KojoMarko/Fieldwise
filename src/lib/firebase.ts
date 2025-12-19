
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

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// This function should only be called on the client side.
export function initializeFirebase(): FirebaseServices {
  if (typeof window !== 'undefined') {
    if (getApps().length === 0) {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('Firebase configuration is incomplete. Check your environment variables.');
      }
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    } else {
      app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    }
    return { app, auth, db, storage };
  }
  // This is a server-side render, return dummy objects or throw error.
  // For this app, client-side initialization is sufficient.
  // If server-side firebase access is needed, it should be done via `firebase-admin`.
  throw new Error("Firebase cannot be initialized on the server. Use `firebase/client-provider` or ensure this is only called on the client.");
}

const getClientServices = () => {
    if (app && auth && db && storage) {
        return { app, auth, db, storage };
    }
    // This will trigger initialization if it hasn't happened yet.
    return initializeFirebase();
};

const clientServices = typeof window !== 'undefined' ? getClientServices() : { app: undefined, auth: undefined, db: undefined, storage: undefined };

const clientApp = clientServices.app;
const clientAuth = clientServices.auth;
const clientDb = clientServices.db;
const clientStorage = clientServices.storage;

export { 
  clientApp as app, 
  clientAuth as auth, 
  clientDb as db, 
  clientStorage as storage 
};
