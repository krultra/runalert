// Server-side API route for user roles
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    console.error('Error in user-roles API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}
