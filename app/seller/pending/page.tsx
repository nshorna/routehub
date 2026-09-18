'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SellerPendingPage() {
  const { user, getIdToken, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      try {
        const idToken = await getIdToken();
        if (!idToken) return;

        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const dbUser = data.user;

          // If approved, redirect to dashboard
          if (dbUser.status === 'APPROVED') {
            router.push('/seller/orders');
          }
          // If rejected, show rejection message
          if (dbUser.status === 'REJECTED') {
            router.push('/seller/rejected');
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, getIdToken, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/seller/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Account Pending Approval</CardTitle>
          <CardDescription>
            Your seller account is currently pending approval from our administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We're reviewing your application. You'll receive a notification once your account has been approved.
            This usually takes 24-48 hours.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
                Back to Home
              </Button>
              <Button className="flex-1" onClick={() => window.location.reload()}>
                Refresh Status
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
