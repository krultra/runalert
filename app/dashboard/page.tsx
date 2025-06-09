'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { signOut } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import { auth } from '@/lib/firebase/config';
import { SoundTest } from '@/app/components/SoundTest';
import { TestMessageGenerator } from '@/app/components/TestMessageGenerator';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
      // Even if sign out fails due to Firebase not being initialized,
      // we should still redirect the user to the login page
      router.push('/login');
    }
  };

  if (!user) {
    return null; // This should never happen because of ProtectedRoute, but TypeScript needs this
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">RunAlert</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-4" style={{ minHeight: '30rem' }}>
                <p className="text-center text-gray-500 mb-8">
                  Welcome to your dashboard!
                </p>
                
                {/* Test Message Generator Component */}
                <TestMessageGenerator />
                
                {/* Sound Test Component */}
                <SoundTest />

                {/* DEMO LAUNCH BUTTONS */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/demo/messages" className="w-full sm:w-auto">
                    <button type="button" className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">
                      Classic RunAlert Demo
                    </button>
                  </a>
                  <a href="/demo/shadcn" className="w-full sm:w-auto">
                    <button type="button" className="w-full px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold shadow hover:bg-gray-700 transition">
                      shadcn/UI Accordion Demo
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
