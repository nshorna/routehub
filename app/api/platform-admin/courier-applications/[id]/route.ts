import { NextRequest, NextResponse } from 'next/server';
import { verifyPlatformAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    await verifyPlatformAdmin(idToken);

    const { id } = await params;

    // Fetch rider by ID with files
    const rider = await prisma.rider.findUnique({
      where: { id },
      include: {
        files: {
          include: {
            file: true,
          },
        },
        roleAssignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!rider) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get user name from role assignments
    const user = rider.roleAssignments[0]?.user;
    const fullName = user?.name || rider.ghanaCardName || 'Unknown';

    // Get files
    const licenseFile = rider.files.find((rf) => rf.fileType === 'LICENSE');
    const profileFile = rider.files.find((rf) => rf.fileType === 'PROFILE_PHOTO');
    const ghanaCardFile = rider.files.find((rf) => rf.fileType === 'GHANA_CARD');

    // Map status
    let status: 'pending' | 'approved' | 'rejected' = 'pending';
    if (rider.status === 'APPROVED') status = 'approved';
    else if (rider.status === 'REJECTED') status = 'rejected';
    else status = 'pending';

    const application = {
      id: rider.id,
      fullName,
      phoneNumber: rider.phone || '',
      email: rider.email || '',
      cardName: rider.ghanaCardName || '',
      cardNumber: rider.ghanaCardNumber || '',
      dateOfBirth: rider.dateOfBirth ? rider.dateOfBirth.toISOString().split('T')[0] : '',
      licenseNumber: rider.licenseNumber || '',
      licenseExpiration: rider.licenseExpiration
        ? rider.licenseExpiration.toISOString().split('T')[0]
        : '',
      licenseImageUrl: licenseFile
        ? `/api/files/${licenseFile.file.uuid}`
        : undefined,
      hasSmartphone: rider.hasSmartphone,
      hasGhanaNumber: rider.hasGhanaNumber,
      profilePhotoUrl: profileFile
        ? `/api/files/${profileFile.file.uuid}`
        : undefined,
      status,
      submittedAt: rider.createdAt,
      reviewedAt: rider.updatedAt !== rider.createdAt ? rider.updatedAt : undefined,
      reviewedBy: undefined, // We don't track who reviewed in the schema
      notes: undefined, // We don't have notes field in the schema
    };

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error fetching courier application:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch courier application',
      },
      { status: 500 }
    );
  }
}
