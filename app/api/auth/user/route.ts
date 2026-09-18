import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const authResult = await verifyFirebaseToken(idToken);

    return NextResponse.json({
      success: true,
      user: authResult.user,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get user' },
      { status: 401 }
    );
  }
}
