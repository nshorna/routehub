'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface PlatformAdminGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function PlatformAdminGuard({ 
  children, 
  redirectTo = '/platform-admin/login'
}: PlatformAdminGuardProps) {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    // Check if user is authenticated
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Verify platform admin with backend
    const verifyPlatformAdmin = async () => {
      try {
        setIsChecking(true);
        const idToken = await getIdToken();
        if (!idToken) {
          router.push(redirectTo);
          return;
        }

        const response = await fetch('/api/auth/verify-platform-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          router.push(redirectTo);
          return;
        }

        // Platform admin verified successfully
        setIsVerified(true);
      } catch (error) {
        console.error('Error verifying platform admin:', error);
        router.push(redirectTo);
      } finally {
        setIsChecking(false);
      }
    };

    verifyPlatformAdmin();
  }, [user, loading, router, getIdToken, redirectTo]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isVerified) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
