// Simple script to test Firebase Auth without browser interactions
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');

// This script requires you to have your .env.local set up properly
// Alternatively, you can replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test user credentials - change these for your test
const testEmail = 'test@example.com';
const testPassword = 'password123';
const testDisplayName = 'Test User';

// Test sign-up
async function testSignUp() {
  console.log(`Testing sign up with ${testEmail}...`);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('Sign up successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error during sign up:', error.code, error.message);
    // If the user already exists, we can proceed to login
    if (error.code === 'auth/email-already-in-use') {
      console.log('User already exists, proceeding to login test');
      return null;
    }
    throw error;
  }
}

// Test sign-in
async function testSignIn() {
  console.log(`Testing sign in with ${testEmail}...`);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('Sign in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Error during sign in:', error.code, error.message);
    throw error;
  }
}

// Test sign-out
async function testSignOut() {
  console.log('Testing sign out...');
  try {
    await signOut(auth);
    console.log('Sign out successful');
  } catch (error) {
    console.error('Error during sign out:', error.code, error.message);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    // Try signup (will fail if user exists, but that's ok)
    await testSignUp();
    
    // Try login
    const user = await testSignIn();
    console.log('User email:', user.email);
    
    // Try logout
    await testSignOut();
    
    console.log('All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Run the test suite
runTests();
