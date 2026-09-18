import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    const authResult = await verifyFirebaseToken(idToken);

    return NextResponse.json({
      success: true,
      user: authResult.user,
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to verify token';
    
    // Log more details for debugging
    if (error instanceof Error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
