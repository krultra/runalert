'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    } else if (!loading && user && requireAdmin && user.email !== 'admin@example.com') {
      // User is not admin, redirect to home or show access denied
      router.push('/');
    }
  }, [user, loading, router, requireAdmin]);

  if (loading || !user || (requireAdmin && user.email !== 'admin@example.com')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
