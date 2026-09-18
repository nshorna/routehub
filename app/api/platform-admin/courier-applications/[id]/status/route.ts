import { NextRequest, NextResponse } from 'next/server';
import { verifyPlatformAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { RiderStatus } from '@/lib/generated/prisma/client';

export async function PATCH(
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
    const platformUser = await verifyPlatformAdmin(idToken);

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, rejected, or pending' },
        { status: 400 }
      );
    }

    // Map status to RiderStatus enum
    let riderStatus: RiderStatus;
    if (status === 'approved') {
      riderStatus = RiderStatus.APPROVED;
    } else if (status === 'rejected') {
      riderStatus = RiderStatus.REJECTED;
    } else {
      riderStatus = RiderStatus.PENDING_APPROVAL;
    }

    // Update rider status
    const rider = await prisma.rider.update({
      where: { id },
      data: {
        status: riderStatus,
        updatedAt: new Date(),
      },
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

    // Get user name from role assignments
    const user = rider.roleAssignments[0]?.user;
    const fullName = user?.name || rider.ghanaCardName || 'Unknown';

    // Get files
    const licenseFile = rider.files.find((rf) => rf.fileType === 'LICENSE');
    const profileFile = rider.files.find((rf) => rf.fileType === 'PROFILE_PHOTO');

    // Map status
    let mappedStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (rider.status === 'APPROVED') mappedStatus = 'approved';
    else if (rider.status === 'REJECTED') mappedStatus = 'rejected';
    else mappedStatus = 'pending';

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
      status: mappedStatus,
      submittedAt: rider.createdAt,
      reviewedAt: rider.updatedAt,
      reviewedBy: platformUser.name || platformUser.email,
      notes: notes || undefined,
    };

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error updating courier application status:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update courier application status',
      },
      { status: 500 }
    );
  }
}
