'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { UserRole } from '@/lib/firebase/roles';

// Temporary auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
};

// Temporary mock for development
const useAuth = (): AuthContextType => ({
  user: null,
  loading: false,
});

// Mock useUserRole
const useUserRole = () => ({
  checkRole: async (role: UserRole) => {
    // Default implementation - should be overridden by the real hook
    console.log('checkRole called with:', role);
    return false;
  },
  loading: false,
});

interface RoleGuardProps {
  children: ReactNode;
  requiredRole: UserRole;
  fallbackUrl?: string;
}

export default function RoleGuard({ 
  children, 
  requiredRole, 
  fallbackUrl = '/login' 
}: RoleGuardProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { checkRole, loading: roleLoading } = useUserRole();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const verifyAccess = async () => {
      if (authLoading || roleLoading) return;
      
      try {
        if (!user) {
          router.push(fallbackUrl);
          return;
        }
        
        const hasRequiredRole = await checkRole(requiredRole);
        setIsAuthorized(hasRequiredRole);
        
        if (!hasRequiredRole) {
          router.push(fallbackUrl);
        }
      } catch (error) {
        console.error('Error verifying access:', error);
        router.push(fallbackUrl);
      } finally {
        setIsChecking(false);
      }
    };
    
    verifyAccess();
  }, [user, authLoading, roleLoading, requiredRole, fallbackUrl, router, checkRole]);
  
  // Show loading state while checking
  if (isChecking || authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Show children if access is granted
  return <>{children}</>;
}
