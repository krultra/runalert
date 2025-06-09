'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isEmailSignInLink, signInWithEmail, getEmailFromStorage, clearEmailFromStorage } from '@/lib/firebase/config';
import { getAuth, updateProfile } from 'firebase/auth';

export default function ConfirmEmailSignIn() {
  const [status, setStatus] = useState<'loading' | 'success' | 'newUser' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function completeSignIn() {
      try {
        // Check if current URL is a sign-in link
        const isSignInLink = isEmailSignInLink(window.location.href);
        
        if (!isSignInLink) {
          setStatus('error');
          setError('Invalid sign-in link. Please request a new link.');
          return;
        }

        // Get email from localStorage (saved when the link was sent)
        let emailForSignIn = getEmailFromStorage();
        
        // If email is not in storage, ask the user for it
        if (!emailForSignIn) {
          emailForSignIn = window.prompt('Please provide your email for confirmation');
          
          if (!emailForSignIn) {
            setStatus('error');
            setError('Email is required to complete sign-in.');
            return;
          }
        }

        setEmail(emailForSignIn);
        
        // Complete the sign-in process
        const userCredential = await signInWithEmail(emailForSignIn, window.location.href);
        
        // Check if there's a display name in localStorage (for new users)
        const displayName = typeof window !== 'undefined' ? window.localStorage.getItem('displayName') : null;
        
        // If display name exists, update the user's profile
        if (displayName && userCredential.user) {
          try {
            const auth = getAuth();
            // Check if auth and current user are available
            if (auth && auth.currentUser) {
              await updateProfile(auth.currentUser, { displayName });
              console.log('Updated profile with display name:', displayName);
              // Clear the display name from storage
              window.localStorage.removeItem('displayName');
              setStatus('newUser');
            } else {
              console.warn('Auth or current user is undefined, skipping profile update');
              setStatus('success');
            }
          } catch (profileErr) {
            console.error('Error updating profile:', profileErr);
            // Continue with success even if profile update fails
            setStatus('success');
          }
        } else {
          setStatus('success');
        }
        
        // Clear the email from storage
        clearEmailFromStorage();
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/home');
        }, 2000);
        
      } catch (err: any) {
        console.error('Error signing in with email link:', err);
        setStatus('error');
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    }

    completeSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {status === 'loading' ? 'Verifying your email...' : 
             status === 'success' ? 'Sign-in successful!' : 
             status === 'newUser' ? 'Account created!' :
             'Sign-in error'}
          </h2>
        </div>

        {status === 'loading' && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">Welcome back!</p>
            <p className="block sm:inline">You've successfully signed in with {email}.</p>
            <p className="mt-2">Redirecting you to the dashboard...</p>
          </div>
        )}
        
        {status === 'newUser' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">Welcome to RunAlert!</p>
            <p className="block sm:inline">Your account has been created and you're now signed in.</p>
            <p className="mt-2">Redirecting you to the dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">Error signing in</p>
            <p className="block sm:inline">{error}</p>
            <div className="mt-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
