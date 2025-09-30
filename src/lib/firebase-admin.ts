import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { config } from 'dotenv';

config(); 

let adminApp: App;

if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_ADMIN_CREDENTIAL;
  
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_ADMIN_CREDENTIAL environment variable is not set. Please add it to your .env file.'
    );
  }

  try {
    // This sanitization step is crucial for multi-line env variables
    const sanitizedJson = serviceAccountJson.replace(/\\n/g, '\n');
    const serviceAccount = JSON.parse(sanitizedJson);
    
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

  } catch (error: any) {
    console.error("Failed to parse or initialize Firebase Admin SDK:", error);
    throw new Error(
      `Failed to parse FIREBASE_ADMIN_CREDENTIAL. Make sure it is a valid JSON string. Original error: ${error.message}`
    );
  }
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { db, auth };
