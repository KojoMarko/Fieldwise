import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

if (!getApps().length) {
  // Construct the service account object from individual environment variables
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    // The private key needs to have its newlines properly escaped when stored in an env var.
    // We replace the \\n characters with actual \n characters.
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  };

  // Check if all required fields are present
  if (
    !serviceAccount.project_id ||
    !serviceAccount.private_key ||
    !serviceAccount.client_email
  ) {
    throw new Error(
      'Firebase Admin SDK environment variables are not fully set. Please check your .env file.'
    );
  }

  try {
    adminApp = initializeApp({
      // The cert function expects the service account object.
      // We cast to any because the expected type is ServiceAccount, but our constructed object is valid.
      credential: cert(serviceAccount as any),
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
