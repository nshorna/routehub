import { NextRequest, NextResponse } from 'next/server';
import { registerSeller, registerRider } from '@/lib/auth-utils';
import { z } from 'zod';

const sellerSchema = z.object({
  idToken: z.string(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(), // Business email
  businessName: z.string().min(1),
  contactName: z.string().min(1),
  pickupAddress: z.string().min(1),
});

const riderSchema = z.object({
  idToken: z.string(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  // Ghana Card Information
  ghanaCardName: z.string().optional(),
  ghanaCardNumber: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  // Motorcycle License Information
  licenseNumber: z.string().optional(),
  licenseExpiration: z.string().optional(), // ISO date string
  bikeInfo: z.string().optional(),
  // Device Verification
  hasSmartphone: z.boolean().optional(),
  hasGhanaNumber: z.boolean().optional(),
  // File UUIDs (files should be uploaded first, then referenced by UUID)
  licenseImageFileId: z.string().optional(),
  profilePhotoFileId: z.string().optional(),
});

const adminSchema = z.object({
  idToken: z.string(),
  name: z.string().min(1),
  phone: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ role: string }> }
) {
  try {
    const params = await context.params;
    const { role } = params;
    const body = await request.json();

    // Handle seller registration separately with new schema
    if (role.toUpperCase() === 'SELLER') {
      const validatedData = sellerSchema.parse(body);
      const { idToken, ...sellerData } = validatedData;

      try {
        const authResult = await registerSeller(idToken, sellerData);
        return NextResponse.json({
          success: true,
          user: authResult.user,
          message: 'Registration successful',
        });
      } catch (error) {
        // If user exists, return 409 Conflict to trigger redirect
        if (error instanceof Error && error.message.includes('already exists')) {
          return NextResponse.json(
            { error: error.message, redirectToLogin: true },
            { status: 409 }
          );
        }
        throw error;
      }
    }

    // Handle rider registration
    if (role.toUpperCase() === 'RIDER' || role.toUpperCase() === 'COURIER') {
      const validatedData = riderSchema.parse(body);
      const { idToken, ...riderData } = validatedData;

      try {
        const authResult = await registerRider(idToken, riderData);
        return NextResponse.json({
          success: true,
          user: authResult.user,
          message: 'Registration successful',
        });
      } catch (error) {
        // If user exists, return 409 Conflict to trigger redirect
        if (error instanceof Error && error.message.includes('already exists')) {
          return NextResponse.json(
            { error: error.message, redirectToLogin: true },
            { status: 409 }
          );
        }
        throw error;
      }
    }

    // Handle other roles (ADMIN) - Note: These may need updating for new schema
    // For now, return error as they're not implemented with new schema
    return NextResponse.json(
      { error: 'This role registration is not yet implemented with the new schema' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error during registration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 400 }
    );
  }
}
