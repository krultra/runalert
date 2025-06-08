import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Make sure initialization only happens on the server side
const getFirebaseAdminApp = (): App | null => {
  // Check if we're on the server side
  if (typeof window !== 'undefined') {
    console.error('Attempted to initialize Firebase Admin SDK on the client side');
    return null;
  }

  // Check if required environment variables are present
  const requiredEnvVars = ['FIREBASE_ADMIN_PROJECT_ID', 'FIREBASE_ADMIN_PRIVATE_KEY', 'FIREBASE_ADMIN_CLIENT_EMAIL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`);
    // Return null during build to prevent errors
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
      return null;
    }
    // In actual production, we should throw an error
    throw new Error(`Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`);
  }

  try {
    // Create the service account object with required fields
    const serviceAccount = {
      type: process.env.FIREBASE_ADMIN_TYPE || 'service_account',
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
      auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN || 'googleapis.com',
    };

    // Check if admin app is already initialized
    if (getApps().length === 0) {
      return initializeApp({
        credential: cert(serviceAccount as any),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`,
      });
    }
    
    return getApp();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // During build or preview, return null to prevent errors
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
      return null;
    }
    throw error;
  }
};

// Get Admin instances, safely handling null case
let adminApp: App | null;
let adminAuth: any = null;
let adminFirestore: any = null;

try {
  adminApp = getFirebaseAdminApp();
  
  if (adminApp) {
    adminAuth = getAuth(adminApp);
    adminFirestore = getFirestore(adminApp);
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin services:', error);
}

export { adminApp, adminAuth, adminFirestore, getFirebaseAdminApp };
