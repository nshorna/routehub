import { NextRequest, NextResponse } from 'next/server';
import { getSellerAccounts } from '@/lib/auth-utils';

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
    const sellerAccounts = await getSellerAccounts(idToken);

    return NextResponse.json({
      success: true,
      sellerAccounts,
    });
  } catch (error) {
    console.error('Error getting seller accounts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get seller accounts' },
      { status: 401 }
    );
  }
}
