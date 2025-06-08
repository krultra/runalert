import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

// Define available roles in the application (copied from roles.ts)
export type UserRole = 'user' | 'premium' | 'admin';

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

/**
 * Client-side hook for checking user roles via API
 */
export function useUserRole() {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRoles = async () => {
    if (!user) return;

    try {
      // Fetch roles from the API route
      const response = await fetch('/api/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, action: 'check' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }

      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Error checking user roles:', error);
      setRoles([]);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchRoles();
    } else if (!user) {
      setRoles([]);
    }
  }, [user, loading]);

  // Determine if the user has a specific role
  const hasUserRole = (role: string): boolean => {
    return roles.includes(role as UserRole);
  };

  // Check if the user has any of the specified roles
  const hasAnyRole = (requiredRoles: string[]): boolean => {
    if (!user) return false;
    
    for (const role of requiredRoles) {
      if (roles.includes(role as UserRole)) {
        return true;
      }
    }
    
    return false;
  };

  // Force refresh the user's token to get updated claims
  const refreshClaims = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      setIsRefreshing(true);
      
      // Force token refresh in Firebase Auth
      await user.getIdToken(true);
      
      // Refresh our local roles data
      await fetchRoles();
      return true;
    } catch (error) {
      console.error('Error refreshing claims:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    roles,
    isAdmin: hasUserRole('admin'),
    isPremium: hasUserRole('premium'),
    isUser: hasUserRole('user'),
    hasRole: hasUserRole,
    hasAnyRole,
    refreshClaims,
    isRefreshing,
    loading: loading || isRefreshing,
  };
}
