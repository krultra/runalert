'use client';

import { useState } from 'react';
import { sendSignInLink } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailSent(false);
    setLoading(true);
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!displayName || displayName.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      setLoading(false);
      return;
    }

    try {
      // Store the display name in localStorage to use when completing signup
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('displayName', displayName);
      }
      
      // Send sign-in link to the provided email
      await sendSignInLink(email);
      setEmailSent(true);
      console.log('Signup link sent to', email);
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to send signup link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register for RunAlert
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {emailSent && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Check your email!</strong>
            <p className="block sm:inline"> We've sent a sign-in link to {email}.</p>
            <p className="mt-2 text-sm">Click the link in the email to complete your registration.</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="display-name"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Your full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading || emailSent}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || emailSent}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || emailSent}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending link...' : 'Create account'}
            </button>
          </div>
        </form>
        
        <div className="text-sm text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
