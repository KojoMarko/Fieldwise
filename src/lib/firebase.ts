
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

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
  db: Firestore;
  auth: Auth;
}

let firebaseServices: FirebaseServices | null = null;

function initializeFirebase(): FirebaseServices {
    if (firebaseServices) {
        return firebaseServices;
    }

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    firebaseServices = { app, db, auth };
    return firebaseServices;
}


const { app, db, auth } = initializeFirebase();

export { app, db, auth, initializeFirebase };
