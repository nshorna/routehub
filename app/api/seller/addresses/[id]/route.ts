import { NextRequest, NextResponse } from 'next/server';
import * as sellerModel from '@/lib/models/seller';
import { prisma } from '@/lib/prisma';

// PATCH set address as default
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const sellerData = await sellerModel.getCurrentSeller(idToken);

    if (!sellerData) {
      return NextResponse.json(
        { error: 'Seller not found or unauthorized' },
        { status: 403 }
      );
    }

    // Verify the address belongs to the seller
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    if (address.sellerId !== sellerData.sellerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // First, unset all other default addresses for this seller
    await prisma.address.updateMany({
      where: {
        sellerId: sellerData.sellerId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Then set this address as default
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });

    return NextResponse.json({
      success: true,
      address: {
        id: updatedAddress.id,
        name: updatedAddress.name,
        description: updatedAddress.description,
        latitude: updatedAddress.latitude.toNumber(),
        longitude: updatedAddress.longitude.toNumber(),
        isDefault: updatedAddress.isDefault,
        createdAt: updatedAddress.createdAt,
        updatedAt: updatedAddress.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set default address' },
      { status: 500 }
    );
  }
}

// DELETE an address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const sellerData = await sellerModel.getCurrentSeller(idToken);

    if (!sellerData) {
      return NextResponse.json(
        { error: 'Seller not found or unauthorized' },
        { status: 403 }
      );
    }

    // Verify the address belongs to the seller
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    if (address.sellerId !== sellerData.sellerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the address
    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting seller address:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete address' },
      { status: 500 }
    );
  }
}
