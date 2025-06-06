import { initializeApp, getApps, getApp } from 'firebase/app';
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
  signInWithPopup
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

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
  // Save the email to localStorage for later use
  saveEmailForSignIn(email);
  
  // Send the sign-in link to the provided email
  return sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

// Check if the current URL is a sign-in link
export const isEmailSignInLink = (url: string): boolean => {
  return isSignInWithEmailLink(auth, url);
};

// Complete sign-in with email link
export const signInWithEmail = async (email: string, url: string): Promise<UserCredential> => {
  return signInWithEmailLink(auth, email, url);
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

// Sign out the current user
export const signOut = (): Promise<void> => {
  return firebaseSignOut(auth);
};

export { app, auth, db };

