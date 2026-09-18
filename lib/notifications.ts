"use server";

import { firebaseAdmin } from "./firebase.server";
import { prisma } from "./prisma";
import { normalizePhoneTo233 } from "./utils";

/**
 * Send a push notification to a user by their phone number
 */
export async function sendNotificationToUser(
  phoneNumber: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneTo233(phoneNumber);
    console.log(`[Notification] Looking up user with normalized phone: ${normalizedPhone}`);

    // Find user by phone number (User.id can be phone number)
    // Try finding by User.id first (which is the phone for phone auth users)
    let user = await prisma.user.findUnique({
      where: { id: normalizedPhone },
      select: { id: true, phone: true, devices: { select: { id: true, fcmToken: true } } },
    });

    // If not found by id, try finding by User.phone field
    if (!user) {
      console.log(`[Notification] User not found by id, trying phone field...`);
      user = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
        select: { id: true, phone: true, devices: { select: { id: true, fcmToken: true } } },
      });
    }

    // If still not found, try alternative formats (without +, with 0 prefix, etc.)
    if (!user) {
      console.log(`[Notification] User not found by phone field, trying alternative formats...`);
      // Try without + prefix
      const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: phoneWithoutPlus },
            { phone: phoneWithoutPlus },
            { id: { contains: phoneWithoutPlus.slice(-9) } }, // Last 9 digits
            { phone: { contains: phoneWithoutPlus.slice(-9) } },
          ],
        },
        select: { id: true, phone: true, devices: { select: { id: true, fcmToken: true } } },
      });
    }

    if (!user) {
      console.log(`[Notification] User not found in database. Searched for: ${normalizedPhone}`);
      return false;
    }

    // Get all devices for this user
    const devices = user.devices || [];
    
    if (devices.length === 0) {
      console.log(`[Notification] No devices found for user with phone: ${normalizedPhone}`);
      console.log(`[Notification] User id: ${user.id}, phone: ${user.phone}`);
      return false;
    }

    console.log(`[Notification] Found user with ${devices.length} device(s). User id: ${user.id}, phone: ${user.phone}`);
    
    // Send notification using Firebase Admin SDK
    const messaging = firebaseAdmin.messaging();
    
    // Convert data values to strings (FCM requirement)
    const dataPayload: Record<string, string> = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        dataPayload[key] = String(value);
      }
    }

    // Base message structure
    const baseMessage = {
      notification: {
        title,
        body,
      },
      data: {
        // Include notification data in data payload for foreground handling
        title,
        body,
        ...dataPayload,
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icon.svg",
          badge: "/icon.svg",
          requireInteraction: false,
          // Add actions if needed
        },
        ...(dataPayload.deliveryId || dataPayload.orderId ? {
          fcmOptions: {
            link: dataPayload.deliveryId 
              ? `/customer/track/${dataPayload.deliveryId}`
              : `/seller/orders/${dataPayload.orderId}`,
          },
        } : {}),
      },
      // Android-specific options
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      // APNS options for iOS
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send to all devices
    const invalidTokenIds: string[] = [];
    let successCount = 0;

    for (const device of devices) {
      try {
        const message = {
          ...baseMessage,
          token: device.fcmToken,
        };

        const response = await messaging.send(message);
        console.log(`[Notification] Successfully sent to device ${device.id}:`, response);
        successCount++;
      } catch (error) {
        console.error(`[Notification] Error sending to device ${device.id}:`, error);
        
        // If token is invalid, mark for deletion
        if (error instanceof Error && (
          error.message.includes("invalid") || 
          error.message.includes("not found") ||
          error.message.includes("registration-token-not-registered")
        )) {
          invalidTokenIds.push(device.id);
        }
      }
    }

    // Clean up invalid tokens
    if (invalidTokenIds.length > 0) {
      console.log(`[Notification] Removing ${invalidTokenIds.length} invalid device token(s)`);
      await prisma.device.deleteMany({
        where: { id: { in: invalidTokenIds } },
      });
    }

    // Return true if at least one notification was sent successfully
    return successCount > 0;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}

/**
 * Send a delivery status update notification to the customer
 */
export async function sendDeliveryStatusNotification(
  deliveryId: string,
  newStatus: string
): Promise<boolean> {
  try {
    console.log(`[Notification] Sending delivery status notification for delivery: ${deliveryId}, status: ${newStatus}`);
    
    // Get delivery with customer phone
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: {
        orderId: true,
        customerPhone: true,
        status: true,
        customerId: true,
      },
    });

    if (!delivery || !delivery.customerPhone) {
      console.log(`[Notification] No customer phone found for delivery: ${deliveryId}`);
      return false;
    }

    console.log(`[Notification] Delivery found - Order ID: ${delivery.orderId}, Customer Phone: ${delivery.customerPhone}, Customer ID: ${delivery.customerId}`);

    // Format status for display
    const statusMessages: Record<string, { title: string; body: string }> = {
      PENDING: {
        title: "Order Received",
        body: `Your order ${delivery.orderId} has been received and is pending pickup.`,
      },
      PICKED_UP: {
        title: "Order Picked Up",
        body: `Your order ${delivery.orderId} has been picked up by the rider.`,
      },
      IN_TRANSIT: {
        title: "Order In Transit",
        body: `Your order ${delivery.orderId} is on the way to you!`,
      },
      DELIVERED: {
        title: "Order Delivered",
        body: `Your order ${delivery.orderId} has been delivered successfully!`,
      },
      CANCELLED: {
        title: "Order Cancelled",
        body: `Your order ${delivery.orderId} has been cancelled.`,
      },
    };

    const message = statusMessages[newStatus] || {
      title: "Order Status Updated",
      body: `Your order ${delivery.orderId} status has been updated.`,
    };

    // Send notification
    const result = await sendNotificationToUser(
      delivery.customerPhone,
      message.title,
      message.body,
      {
        deliveryId,
        orderId: delivery.orderId,
        status: newStatus,
        type: "delivery_status_update",
      }
    );

    if (result) {
      console.log(`[Notification] Successfully sent notification to customer for delivery ${deliveryId}`);
    } else {
      console.log(`[Notification] Failed to send notification to customer for delivery ${deliveryId}`);
    }

    return result;
  } catch (error) {
    console.error("[Notification] Error sending delivery status notification:", error);
    return false;
  }
}
