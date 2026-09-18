import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

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
    const userId = authResult.user.id;

    const body = await request.json();
    const { fcmToken, deviceInfo, deleteToken } = body;

    // Handle token deletion (for disabling notifications on a specific device)
    if (deleteToken === true && fcmToken) {
      // Delete only the specific device token, not all devices
      const deletedDevice = await prisma.device.findUnique({
        where: { fcmToken },
        select: { id: true, userId: true },
      });

      if (deletedDevice && deletedDevice.userId === userId) {
        await prisma.device.delete({
          where: { fcmToken },
        });
        console.log(`[FCM Token] Deleted device ${deletedDevice.id} for user ${userId}`);
        
        const remainingCount = await prisma.device.count({ where: { userId } });
        console.log(`[FCM Token] User ${userId} now has ${remainingCount} device(s) remaining`);
        
        return NextResponse.json({
          success: true,
          message: 'FCM token deleted successfully',
          deviceCount: remainingCount,
        });
      } else if (deletedDevice) {
        // Token exists but belongs to different user - don't delete
        console.log(`[FCM Token] Token belongs to different user, not deleting`);
        return NextResponse.json({
          success: false,
          message: 'Token not found for this user',
        }, { status: 404 });
      } else {
        // Token doesn't exist - already deleted or never existed
        console.log(`[FCM Token] Token not found, nothing to delete`);
        const remainingCount = await prisma.device.count({ where: { userId } });
        return NextResponse.json({
          success: true,
          message: 'Token not found (may already be deleted)',
          deviceCount: remainingCount,
        });
      }
    }

    // Validate fcmToken for creation/update
    if (fcmToken !== null && (typeof fcmToken !== 'string' || fcmToken.trim() === '')) {
      return NextResponse.json(
        { error: 'FCM token must be a valid string' },
        { status: 400 }
      );
    }

    // Handle null token (legacy support - but should not delete all devices)
    // This should not happen with the updated frontend, but keeping for backward compatibility
    if (fcmToken === null) {
      console.log(`[FCM Token] Received null token without deleteToken flag - ignoring (legacy behavior)`);
      const deviceCount = await prisma.device.count({ where: { userId } });
      return NextResponse.json({
        success: true,
        message: 'No action taken (null token without delete flag)',
        deviceCount,
      });
    }

    // Create or update device token
    // Check if a device with this fcmToken already exists
    const existingDevice = await prisma.device.findUnique({
      where: { fcmToken },
      select: { id: true, userId: true, fcmToken: true },
    });

    // Get current device count for this user (for logging)
    const userDeviceCount = await prisma.device.count({
      where: { userId },
    });

    if (existingDevice) {
      if (existingDevice.userId === userId) {
        // Same device, same user - just update device info
        console.log(`[FCM Token] Updating existing device ${existingDevice.id} for user ${userId} (user has ${userDeviceCount} device(s))`);
        await prisma.device.update({
          where: { fcmToken },
          data: {
            deviceInfo: deviceInfo || null,
            updatedAt: new Date(),
          },
        });
      } else {
        // Token was moved to a different user - update the userId
        console.log(`[FCM Token] Moving device ${existingDevice.id} from user ${existingDevice.userId} to user ${userId}`);
        await prisma.device.update({
          where: { fcmToken },
          data: {
            userId,
            deviceInfo: deviceInfo || null,
            updatedAt: new Date(),
          },
        });
      }
    } else {
      // New device for this user - create a new record
      // This allows multiple devices per user (each with unique fcmToken)
      console.log(`[FCM Token] Creating new device for user ${userId} (user will have ${userDeviceCount + 1} device(s))`);
      await prisma.device.create({
        data: {
          userId,
          fcmToken,
          deviceInfo: deviceInfo || null,
        },
      });
    }

    // Log final device count for verification
    const finalDeviceCount = await prisma.device.count({
      where: { userId },
    });
    console.log(`[FCM Token] User ${userId} now has ${finalDeviceCount} device(s) registered`);

    // Get final device count for response
    const deviceCount = await prisma.device.count({ where: { userId } });

    return NextResponse.json({
      success: true,
      message: 'FCM token saved successfully',
      deviceCount,
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save FCM token' },
      { status: 500 }
    );
  }
}
