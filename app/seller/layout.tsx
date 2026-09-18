'use client';

import type { ReactNode } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { SellerGuard } from "@/components/auth/seller-guard"
import { SellerAccountProvider } from "@/lib/seller-account-context"
import { usePathname } from "next/navigation"

export default function SellerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/seller/login'
  const isRegisterPage = pathname === '/seller/register'
  const isPendingPage = pathname === '/seller/pending'

  // Don't protect the login and register pages - they should be accessible without auth
  if (isLoginPage || isRegisterPage) {
    return <>{children}</>
  }

  return (
    <AuthGuard redirectTo="/seller/login">
      <SellerAccountProvider>
        {isPendingPage ? (
          // Pending page doesn't require approved status
          children
        ) : (
          <SellerGuard requireApproved={true} redirectTo="/seller/login">
            {children}
          </SellerGuard>
        )}
      </SellerAccountProvider>
    </AuthGuard>
  )
}
