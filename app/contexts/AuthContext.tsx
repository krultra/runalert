'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

interface CustomUser extends FirebaseUser {
  dismissedMessages?: string[]; // Array of message IDs that the user has dismissed
}
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is undefined, we can't listen to auth state changes
    // This can happen during SSR or when Firebase isn't initialized
    if (!auth) {
      console.warn('Firebase auth is not initialized, authentication features will not work');
      setLoading(false);
      return () => {};
    }
    
    // Only set up the listener if auth is available
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
