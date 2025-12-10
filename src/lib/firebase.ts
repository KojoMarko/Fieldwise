
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

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
    if (services) {
        return services;
    }

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    if (process.env.NODE_ENV === 'development') {
        try {
            connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
            connectStorageEmulator(storage, '127.0.0.1', 9199);
            console.log("Connected to local Firebase emulators.");
        } catch (e) {
            console.warn("Could not connect to Firebase emulators. This is expected in production.", e);
        }
    }
    
    services = { app, db, auth, storage };
    return services;
}

// --- DEPRECATED ---
// The following exports are for legacy compatibility and will be removed in a future version.
// It is recommended to use the `initializeFirebase` function within `FirebaseClientProvider`.

const legacyApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(legacyApp);
const auth = getAuth(legacyApp);
const storage = getStorage(legacyApp);

try {
  if (process.env.NODE_ENV === 'development') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }
} catch (e) {
  // This can happen with Next.js fast refresh.
  // The emulators are likely already connected.
}

export { db, auth, storage };
