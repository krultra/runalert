'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import RoleGuard from '@/app/components/auth/RoleGuard';

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  roles: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const db = getFirestore();
        
        // Check if Firestore is initialized
        if (!db) {
          setError('Firebase is not initialized. Please check your connection and try again.');
          setLoading(false);
          return;
        }
        
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        
        const userData: UserData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          userData.push({
            uid: doc.id,
            email: data.email || '',
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            roles: data.roles || ['user'],
          });
        });
        
        setUsers(userData);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  async function handleSetRole(userId: string, role: string, add: boolean) {
    try {
      // Get current user's ID token
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('You must be logged in to perform this action');
      }
      
      const idToken = await currentUser.getIdToken();
      
      // Call our API to set custom claims
      const response = await fetch('/api/auth/set-custom-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetUserId: userId,
          claims: {
            roles: add ? [role] : [],
            [role]: add,
            updatedAt: new Date().getTime(),
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }
      
      // Update local state to reflect the change
      setUsers(users.map(user => {
        if (user.uid === userId) {
          const updatedRoles = add 
            ? [...new Set([...user.roles, role])]
            : user.roles.filter(r => r !== role);
          
          return { ...user, roles: updatedRoles };
        }
        return user;
      }));
      
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message);
    }
  }

  return (
    <RoleGuard requiredRole="admin" fallbackUrl="/dashboard">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photoURL && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.uid}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span 
                            key={role}
                            className={`px-2 py-1 text-xs rounded-full ${
                              role === 'admin' ? 'bg-red-100 text-red-800' :
                              role === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSetRole(user.uid, 'admin', !user.roles.includes('admin'))}
                          className={`px-3 py-1 rounded-md text-xs ${
                            user.roles.includes('admin')
                              ? 'bg-red-200 hover:bg-red-300 text-red-800'
                              : 'bg-red-100 hover:bg-red-200 text-red-800'
                          }`}
                        >
                          {user.roles.includes('admin') ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleSetRole(user.uid, 'premium', !user.roles.includes('premium'))}
                          className={`px-3 py-1 rounded-md text-xs ${
                            user.roles.includes('premium')
                              ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                              : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {user.roles.includes('premium') ? 'Remove Premium' : 'Make Premium'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
