import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

// Only admins can call this endpoint to set custom claims
export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      console.error('Firebase Admin SDK not initialized. Check environment variables.');
      return NextResponse.json({ 
        error: 'Server configuration error. Please contact an administrator.'
      }, { status: 500 });
    }
    
    const authorization = request.headers.get('authorization');
    const data = await request.json();
    const { targetUserId, claims } = data;
    
    // Verify the caller is authenticated and has admin privileges
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the caller has admin rights
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Set custom claims for the target user
    await adminAuth.setCustomUserClaims(targetUserId, claims);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to set user claims'
    }, { status: 500 });
  }
}
