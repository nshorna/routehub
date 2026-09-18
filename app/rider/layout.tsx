'use client';

import type { ReactNode } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { usePathname } from "next/navigation"

export default function RiderLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/rider/login'
  const isRegisterPage = pathname === '/rider/register'

  // Don't protect the login and register pages - they should be accessible without auth
  if (isLoginPage || isRegisterPage) {
    return <>{children}</>
  }

  return (
    <AuthGuard redirectTo="/rider/login">
      {children}
    </AuthGuard>
  )
}
