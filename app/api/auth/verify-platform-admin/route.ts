import { NextRequest, NextResponse } from 'next/server';
import { verifyPlatformAdmin } from '@/lib/auth-utils';

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

    const platformUser = await verifyPlatformAdmin(idToken);

    return NextResponse.json({
      success: true,
      user: platformUser,
    });
  } catch (error) {
    console.error('Error verifying platform admin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify platform admin' },
      { status: 401 }
    );
  }
}
