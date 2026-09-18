'use client';

import { useEffect } from 'react';
import { onMessage, messaging, initMessaging } from '@/lib/firebase.client';

/**
 * Component that handles foreground notifications
 * On desktop Chrome, notifications don't show automatically when the tab is open.
 * This component listens for foreground messages and displays them manually.
 */
export function ForegroundNotificationHandler() {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let messagingInstance: typeof messaging = null;

    const setupForegroundHandler = async () => {
      try {
        // Initialize messaging if not already initialized
        messagingInstance = await initMessaging();
        
        if (!messagingInstance) {
          console.log('[ForegroundNotificationHandler] Messaging not supported');
          return;
        }

        // Check if notifications are supported and permission is granted
        if ('Notification' in window && Notification.permission === 'granted') {
          // Set up foreground message handler
          unsubscribe = onMessage(messagingInstance, (payload) => {
            console.log('[ForegroundNotificationHandler] Received foreground message:', payload);
            
            // Extract notification data
            const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
            const notificationBody = payload.notification?.body || payload.data?.body || '';
            const notificationIcon = payload.notification?.icon || '/icon.svg';
            
            // Show notification using the browser's Notification API
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(notificationTitle, {
                body: notificationBody,
                icon: notificationIcon,
                badge: '/icon.svg',
                tag: payload.data?.deliveryId || payload.data?.orderId || 'notification',
                requireInteraction: false,
                silent: false,
                // Add click handler if there's navigation data
                data: payload.data,
              });

              // Handle notification click
              notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                
                // If there's a delivery ID or order ID, you could navigate to that page
                if (payload.data?.deliveryId) {
                  // Navigate to delivery tracking page
                  window.location.href = `/customer/track/${payload.data.deliveryId}`;
                } else if (payload.data?.orderId) {
                  // Navigate to order page (adjust based on your routing)
                  window.location.href = `/seller/orders/${payload.data.orderId}`;
                }
                
                notification.close();
              };

              // Auto-close after 5 seconds if not clicked
              setTimeout(() => {
                notification.close();
              }, 5000);
            }
          });
          
          console.log('[ForegroundNotificationHandler] Foreground message handler set up successfully');
        } else {
          console.log('[ForegroundNotificationHandler] Notification permission not granted');
        }
      } catch (error) {
        console.error('[ForegroundNotificationHandler] Error setting up foreground handler:', error);
      }
    };

    setupForegroundHandler();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}
