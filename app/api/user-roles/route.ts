// Server-side API route for user roles
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      console.error('Firebase Admin SDK not initialized. Check environment variables.');
      return NextResponse.json({ 
        error: 'Server configuration error',
        // During production build, we can still return mock data for roles
        roles: ['user']
      }, { status: 200 });
    }
    
    const { uid, action = 'check', role } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user from Firebase Admin
    const userRecord = await adminAuth.getUser(uid);
    const customClaims = userRecord.customClaims || {};
    const roles = customClaims.roles || [];

    switch (action) {
      case 'check':
        return NextResponse.json({ 
          hasRole: roles.includes(role),
          roles 
        });
      
      case 'refresh':
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' }, 
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in user-roles API:', error);
    
    // Return a default response during build
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
      return NextResponse.json({
        error: 'Server configuration in progress',
        roles: ['user']
      }, { status: 200 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to process request' }, 
      { status: 500 }
    );
  }
}
