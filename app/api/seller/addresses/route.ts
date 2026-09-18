import { NextRequest, NextResponse } from 'next/server';
import * as sellerModel from '@/lib/models/seller';
import { prisma } from '@/lib/prisma';

// GET all addresses for the authenticated seller
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
    const sellerData = await sellerModel.getCurrentSeller(idToken);

    if (!sellerData) {
      return NextResponse.json(
        { error: 'Seller not found or unauthorized' },
        { status: 403 }
      );
    }

    // Get all addresses for this seller
    const addresses = await prisma.address.findMany({
      where: {
        sellerId: sellerData.sellerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      addresses: addresses.map(addr => ({
        id: addr.id,
        name: addr.name,
        description: addr.description,
        latitude: addr.latitude.toNumber(),
        longitude: addr.longitude.toNumber(),
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
        updatedAt: addr.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching seller addresses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST create a new address
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { name, description, latitude, longitude } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Address name is required' },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    // Create the address
    const address = await prisma.address.create({
      data: {
        sellerId: sellerData.sellerId,
        name: name.trim(),
        description: description ? description.trim() : null,
        latitude: latitude,
        longitude: longitude,
      },
    });

    return NextResponse.json({
      success: true,
      address: {
        id: address.id,
        name: address.name,
        description: address.description,
        latitude: address.latitude.toNumber(),
        longitude: address.longitude.toNumber(),
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating seller address:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create address' },
      { status: 500 }
    );
  }
}
