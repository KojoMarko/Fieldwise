
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Check if all required environment variables are present.
// This is important for production environments like Vercel.
if (projectId && clientEmail && privateKey) {
  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  if (getApps().length === 0) {
    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error: any) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
      // In a server environment, it's better to throw to indicate a critical configuration error.
      // However, to prevent a hard crash on Vercel if variables are missing,
      // we'll log the error and allow the app to run in a degraded state.
    }
  } else {
    adminApp = getApps()[0];
  }
} else {
  console.warn("Firebase Admin environment variables are not fully set. Admin SDK not initialized.");
}

// These will be undefined if adminApp is not initialized, which is expected
// if the environment variables are not present. The flows using this will
// then fail gracefully instead of crashing the server on startup.
const db = adminApp! ? getFirestore(adminApp) : (undefined as any);
const auth = adminApp! ? getAuth(adminApp) : (undefined as any);


export { db, auth };
