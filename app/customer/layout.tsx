'use client';

import type { ReactNode } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { usePathname } from "next/navigation"

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/customer/login'

  // Don't protect the login page - it should be accessible without auth
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <AuthGuard redirectTo="/customer/login">
      {children}
    </AuthGuard>
  )
}
