import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { normalizePhoneTo233 } from '@/lib/utils';

// GET all addresses for the authenticated user
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
      // Customer doesn't exist yet, return empty array
      return NextResponse.json({
        success: true,
        addresses: [],
      });
    }

    // Get all addresses for this customer
    const addresses = await prisma.address.findMany({
      where: {
        customerId: customer.id,
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
        createdAt: addr.createdAt,
        updatedAt: addr.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
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
    const authResult = await verifyFirebaseToken(idToken);

    // Get or create customer record
    if (!authResult.user.phone) {
      return NextResponse.json(
        { error: 'Phone number is required for customer addresses' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneTo233(authResult.user.phone);
    const customer = await prisma.customer.upsert({
      where: { phone: normalizedPhone },
      update: {},
      create: {
        phone: normalizedPhone,
        name: authResult.user.name || undefined,
      },
    });

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
        customerId: customer.id,
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
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create address' },
      { status: 500 }
    );
  }
}
