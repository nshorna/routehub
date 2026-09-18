'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { messaging, getToken, initMessaging } from '@/lib/firebase.client';

interface NotificationEnableButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
}

export function NotificationEnableButton({ 
  className,
  variant = 'outline',
  size = 'default'
}: NotificationEnableButtonProps) {
  const { getIdToken, user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagingSupported, setMessagingSupported] = useState<boolean | null>(null);
  const [messagingInstance, setMessagingInstance] = useState<typeof messaging>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Initialize messaging and check support
  useEffect(() => {
    const initialize = async () => {
      try {
        const instance = await initMessaging();
        setMessagingInstance(instance);
        setMessagingSupported(instance !== null);
      } catch (error) {
        console.error('Error initializing messaging:', error);
        setMessagingSupported(false);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Check if notifications are already enabled
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!user || !messagingInstance) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if we have permission
        if ('Notification' in window && Notification.permission === 'granted') {
          // Try to get the token to see if it's already registered
          try {
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            const tokenOptions = vapidKey ? { vapidKey } : undefined;
            
            const token = await getToken(messagingInstance, tokenOptions);
            if (token) {
              setIsEnabled(true);
              setCurrentToken(token);
            }
          } catch (err) {
            console.log('No existing token found:', err);
          }
        }
      } catch (err) {
        console.error('Error checking notification status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (messagingInstance) {
      checkNotificationStatus();
    }
  }, [user, messagingInstance]);

  const handleEnableNotifications = async () => {
    if (!user || !messagingInstance) {
      setError('Notifications are not supported in this browser');
      return;
    }

    setIsEnabling(true);
    setError(null);

    try {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          setError('Notification permission denied');
          setIsEnabling(false);
          return;
        }
      } else {
        setError('This browser does not support notifications');
        setIsEnabling(false);
        return;
      }

      // Get FCM token
      // Note: VAPID key should be set in environment variables
      // For now, we'll try without it first (Firebase may use default)
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const tokenOptions = vapidKey ? { vapidKey } : undefined;
      
      const token = await getToken(messagingInstance, tokenOptions);
      
      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      // Save token to backend
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/auth/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ fcmToken: token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save FCM token');
      }

      setIsEnabled(true);
      setCurrentToken(token);
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsEnabling(true);
    setError(null);

    try {
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Get current token if we don't have it stored
      let tokenToDelete = currentToken;
      if (!tokenToDelete && messagingInstance) {
        try {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          const tokenOptions = vapidKey ? { vapidKey } : undefined;
          tokenToDelete = await getToken(messagingInstance, tokenOptions);
        } catch (err) {
          console.log('Could not get current token for deletion:', err);
        }
      }

      // Delete specific token from backend (only this device's token)
      const response = await fetch('/api/auth/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          fcmToken: tokenToDelete, // Send the specific token to delete
          deleteToken: true // Flag to indicate deletion
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to disable notifications');
      }

      setIsEnabled(false);
      setCurrentToken(null);
    } catch (err) {
      console.error('Error disabling notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setIsEnabling(false);
    }
  };

  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (messagingSupported === false || !messagingInstance) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
        title="Notifications are not supported in this browser"
      >
        <BellOff className="w-4 h-4 mr-2" />
        Not Supported
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={isEnabled ? handleDisableNotifications : handleEnableNotifications}
        disabled={isEnabling}
      >
        {isEnabling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {isEnabled ? 'Disabling...' : 'Enabling...'}
          </>
        ) : isEnabled ? (
          <>
            <Bell className="w-4 h-4 mr-2" />
            Disable Notifications
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4 mr-2" />
            Enable Notifications
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
