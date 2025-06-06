import { User } from 'firebase/auth';
import { adminAuth } from './admin';

// Define available roles in the application
export type UserRole = 'user' | 'premium' | 'admin';

export interface UserClaims {
  roles?: UserRole[];
  admin?: boolean;
  premium?: boolean;
  [key: string]: any;
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(user: User | null, role: UserRole): Promise<boolean> {
  if (!user) return false;
  
  try {
    // Get custom claims from the token
    const idTokenResult = await user.getIdTokenResult();
    const claims = idTokenResult.claims as UserClaims;
    
    if (!claims) return false;
    
    // Check for specific roles
    if (role === 'admin' && claims.admin === true) return true;
    if (role === 'premium' && claims.premium === true) return true;
    
    // Check in roles array if it exists
    return claims.roles?.includes(role) || false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Set roles for a user (server-side only)
 */
export async function setUserRoles(userId: string, roles: UserRole[]): Promise<void> {
  // Create a claims object with role flags
  const claims: UserClaims = {
    roles: roles,
    admin: roles.includes('admin'),
    premium: roles.includes('premium'),
    updatedAt: new Date().getTime(),
  };
  
  // Set the custom claims on the user
  await adminAuth.setCustomUserClaims(userId, claims);
}

/**
 * Add a single role to a user's existing roles
 */
export async function addUserRole(userId: string, role: UserRole): Promise<void> {
  // Get current user record
  const user = await adminAuth.getUser(userId);
  const currentClaims = user.customClaims as UserClaims || {};
  
  // Add the role if it doesn't exist
  const currentRoles = currentClaims.roles || [];
  if (!currentRoles.includes(role)) {
    const newRoles = [...currentRoles, role];
    await setUserRoles(userId, newRoles);
  }
}

/**
 * Remove a role from a user
 */
export async function removeUserRole(userId: string, role: UserRole): Promise<void> {
  // Get current user record
  const user = await adminAuth.getUser(userId);
  const currentClaims = user.customClaims as UserClaims || {};
  
  // Remove the role if it exists
  const currentRoles = currentClaims.roles || [];
  if (currentRoles.includes(role)) {
    const newRoles = currentRoles.filter(r => r !== role);
    await setUserRoles(userId, newRoles);
  }
}

/**
 * Force refresh token to apply custom claims changes immediately
 * This needs to be called client-side after updating claims
 */
export async function refreshUserClaims(user: User): Promise<void> {
  await user.getIdToken(true);
}
