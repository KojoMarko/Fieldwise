
'use server';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountString) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please add it to your .env file.');
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountString);
} catch (error) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.');
}


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
