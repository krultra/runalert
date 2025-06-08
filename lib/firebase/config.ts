import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  signOut as firebaseSignOut,
  updateProfile,
  UserCredential,
  ActionCodeSettings,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Check if we have the required environment variables and log them in development
// This helps debug environment variable issues
const hasRequiredConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Log environment variables for debugging (safe as these are public keys)
if (typeof window !== 'undefined') {
  console.log('Firebase config check:', { 
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hasRequiredConfig,
    inBrowser: typeof window !== 'undefined'
  });
}

// Safely initialize Firebase only when required environment variables are available
// and when we're in a browser environment
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Make sure we're on the client side before initializing Firebase
if (typeof window !== 'undefined' && hasRequiredConfig) {
  try {
    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    console.log('Initializing Firebase with config:', {
      hasApiKey: !!firebaseConfig.apiKey,
      apiKeyLength: firebaseConfig.apiKey?.length,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId
    });
    
    // Initialize Firebase
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize Google provider (moved inside the conditional)
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}
else {
  console.warn(
    'Firebase not initialized because:',
    !hasRequiredConfig ? 'Missing required environment variables' : 'Not in browser environment'
  );
}

// Email link authentication action code settings
const actionCodeSettings: ActionCodeSettings = {
  // URL you want to redirect to after email is verified
  url: typeof window !== 'undefined' ? window.location.origin + '/login/confirm' : 'http://localhost:3000/login/confirm',
  // This must be true for email link sign-in
  handleCodeInApp: true,
};

// Save the email to localStorage for email link authentication
export const saveEmailForSignIn = (email: string): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('emailForSignIn', email);
  }
};

// Get the email from localStorage for email link authentication
export const getEmailFromStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('emailForSignIn');
  }
  return null;
};

// Clear the email from localStorage after sign-in is complete
export const clearEmailFromStorage = (): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('emailForSignIn');
  }
};

// Send sign-in email link
export const sendSignInLink = async (email: string): Promise<void> => {
  // Make sure we have auth initialized
  if (!auth) {
    throw new Error('Firebase auth is not initialized');
  }
  
  // Save the email to localStorage for later use
  saveEmailForSignIn(email);
  
  // Send the sign-in link to the provided email
  return sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

// Check if the current URL is a sign-in link
export const isEmailSignInLink = (url: string): boolean => {
  if (!auth) {
    console.error('Firebase auth is not initialized');
    return false;
  }
  return isSignInWithEmailLink(auth, url);
};

// Complete sign-in with email link
export const signInWithEmail = async (email: string, url: string): Promise<UserCredential> => {
  if (!auth) {
    throw new Error('Firebase auth is not initialized');
  }
  return signInWithEmailLink(auth, email, url);
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  if (!auth) {
    throw new Error('Firebase auth is not initialized');
  }
  
  if (!googleProvider) {
    throw new Error('Google auth provider is not initialized');
  }
  
  return signInWithPopup(auth, googleProvider);
};

// Sign out the current user
export const signOut = (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase auth is not initialized');
  }
  return firebaseSignOut(auth);
};

export { app, auth, db };

