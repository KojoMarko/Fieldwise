import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_ADMIN_CREDENTIAL;
  
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_ADMIN_CREDENTIAL environment variable is not set. Please add it to your .env file.'
    );
  }

  try {
    // The service account JSON might be a stringified JSON with escaped newlines.
    // Or it might be a direct copy-paste with actual newlines.
    // Parsing it directly handles the first case.
    // If that fails, we assume it's the second case and try to parse it after sanitizing.
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
        // This handles the case where the JSON is not a single-line string.
        const sanitizedJson = serviceAccountJson.replace(/\\n/g, '\n');
        serviceAccount = JSON.parse(sanitizedJson);
    }
    
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
