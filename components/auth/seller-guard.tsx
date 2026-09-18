'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSellerAccount } from '@/lib/seller-account-context';

interface SellerGuardProps {
  children: React.ReactNode;
  requireApproved?: boolean;
  redirectTo?: string;
}

export function SellerGuard({ 
  children, 
  requireApproved = true,
  redirectTo = '/seller/login'
}: SellerGuardProps) {
  const { user, loading, getIdToken } = useAuth();
  const { sellerAccounts, selectedSellerAccount, loading: accountsLoading } = useSellerAccount();
  const router = useRouter();

  useEffect(() => {
    if (loading || accountsLoading) return;

    // Check if user is authenticated
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Check if user has any seller accounts
    if (sellerAccounts.length === 0) {
      router.push(redirectTo);
      return;
    }

    // If no account is selected and user has accounts, they need to select one
    if (!selectedSellerAccount) {
      // If only one account, auto-select it (handled by SellerAccountProvider)
      // But if we're here and still no account, redirect to login
      if (sellerAccounts.length > 1) {
        // Multiple accounts - redirect to login to select
        router.push(redirectTo);
        return;
      }
      // Single account case - wait for provider to select it
      return;
    }

    // Check status if approval is required
    if (requireApproved) {
      const status = selectedSellerAccount.seller.status;
      
      if (status === 'PENDING_VERIFICATION' || status === 'PENDING_INFORMATION_UPDATE') {
        router.push('/seller/pending');
        return;
      }
      
      if (status === 'REJECTED' || status === 'SUSPENDED' || status === 'INACTIVE') {
        // Stay on current page but show error - or redirect to login
        router.push(redirectTo);
        return;
      }

      // Only VERIFIED and ACTIVE statuses are allowed
      if (status !== 'VERIFIED' && status !== 'ACTIVE') {
        router.push('/seller/pending');
        return;
      }
    }
  }, [user, loading, sellerAccounts, selectedSellerAccount, accountsLoading, requireApproved, router, redirectTo]);

  if (loading || accountsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || sellerAccounts.length === 0 || !selectedSellerAccount) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
