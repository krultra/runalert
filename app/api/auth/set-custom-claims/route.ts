import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// Only admins can call this endpoint to set custom claims
export async function POST(request: NextRequest) {
  try {
    const adminApp = await getFirebaseAdminApp();
    const authorization = request.headers.get('authorization');
    const data = await request.json();
    const { targetUserId, claims } = data;
    
    // Verify the caller is authenticated and has admin privileges
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await (adminApp as unknown as admin.app.App).auth().verifyIdToken(idToken);
    
    // Check if the caller has admin rights
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Set custom claims for the target user
    await (adminApp as unknown as admin.app.App).auth().setCustomUserClaims(targetUserId, claims);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
