import { NextRequest, NextResponse } from 'next/server';
import { verifyPlatformAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build where clause for search
    const where: any = {};

    // Filter by status
    if (status && status !== 'all') {
      // Map status to RiderStatus enum
      const statusMap: Record<string, string> = {
        'pending': 'PENDING_APPROVAL',
        'approved': 'APPROVED',
        'rejected': 'REJECTED',
      };
      where.status = statusMap[status] || status.toUpperCase().replace('-', '_');
    }

    // Add search conditions
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { ghanaCardName: { contains: search, mode: 'insensitive' } },
        { ghanaCardNumber: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { bikeInfo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch riders (courier applications) with files
    const riders = await prisma.rider.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match the expected format
    const applications = riders.map((rider) => {
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

      return {
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
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching courier applications:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch courier applications',
      },
      { status: 500 }
    );
  }
}
