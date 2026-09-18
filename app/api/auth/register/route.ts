import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-utils';
import { z } from 'zod';

const registerSchema = z.object({
  idToken: z.string(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Verify Firebase token
    const authResult = await verifyFirebaseToken(validatedData.idToken);

    // Update user with additional registration data if needed
    // For customers, the user is already created in verifyFirebaseToken
    // This endpoint can be used to update additional info like name/phone

    return NextResponse.json({
      success: true,
      user: authResult.user,
      message: 'Registration successful',
    });
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
