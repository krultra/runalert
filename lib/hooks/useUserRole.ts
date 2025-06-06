import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { hasRole, UserRole, refreshUserClaims } from '@/lib/firebase/roles';

// Temporary type until we set up the auth context properly
type AuthContextType = {
  user: User | null;
  loading: boolean;
};

// Temporary mock for development
const useAuth = (): AuthContextType => ({
  user: null,
  loading: false,
});

export function useUserRole() {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      // Get the user's ID token result to check claims
      // Use the hasRole function to check each role
      Promise.all([
        hasRole(user, 'admin'),
        hasRole(user, 'premium'),
        hasRole(user, 'user')
      ])
        .then(([isAdmin, isPremium, isUser]) => {
          const userRoles: UserRole[] = [];
          
          // Add roles based on checks
          if (isAdmin) userRoles.push('admin');
          if (isPremium) userRoles.push('premium');
          if (isUser || userRoles.length === 0) userRoles.push('user');
          
          // Always include 'user' role for authenticated users
          if (!userRoles.includes('user')) {
            userRoles.push('user');
          }
          
          setRoles(userRoles);
        })
        .catch((error) => {
          console.error('Error getting token claims:', error);
          // Default to basic user role on error
          setRoles(['user']);
        });
    } else {
      setRoles([]);
    }
  }, [user, loading]);

  /**
   * Check if the current user has a specific role
   */
  async function checkRole(role: UserRole): Promise<boolean> {
    if (!user || loading) return false;
    return hasRole(user, role);
  }

  /**
   * Force a refresh of the token to get updated claims
   */
  async function refreshClaims() {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      await refreshUserClaims(user);
      // Re-fetch token to get updated claims
      await user.getIdTokenResult(true);
    } catch (error) {
      console.error('Error refreshing claims:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    roles,
    hasRole: checkRole,
    isAdmin: checkRole('admin'),
    isPremium: checkRole('premium'),
    refreshClaims,
    isRefreshing,
    loading: loading || isRefreshing,
  };
}
