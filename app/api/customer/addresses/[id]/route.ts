import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { normalizePhoneTo233 } from '@/lib/utils';

// DELETE an address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get or create customer record
    if (!authResult.user.phone) {
      return NextResponse.json(
        { error: 'Phone number is required for customer addresses' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneTo233(authResult.user.phone);
    const customer = await prisma.customer.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const { id: addressId } = await params;

    // Verify the address belongs to the customer
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    if (address.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete address' },
      { status: 500 }
    );
  }
}
