
'use server';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables must be set.');
}

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
    throw new Error(
      `Firebase Admin SDK initialization failed. Error: ${error.message}`
    );
  }
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { db, auth };
