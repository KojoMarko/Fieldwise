
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | undefined;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Make sure to handle the private key newline characters correctly.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Check if all required environment variables are present.
if (projectId && clientEmail && privateKey) {
  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  if (getApps().length === 0) {
    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error("Failed to initialize Firebase Admin SDK:", error.message);
      // In a server environment, it's better to log the error and allow the app to run in a degraded state
      // rather than crashing the entire server process on startup.
    }
  } else {
    adminApp = getApps()[0];
  }
} else {
  console.warn("Firebase Admin environment variables are not fully set. Admin SDK not initialized. This will cause errors in flows requiring admin privileges.");
}

// These will be undefined if adminApp is not initialized.
// The flows that use these must handle the case where they are not available.
const db = adminApp ? getFirestore(adminApp) : (undefined as any);
const auth = adminApp ? getAuth(adminApp) : (undefined as any);


export { db, auth };
