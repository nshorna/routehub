'use client';

import type { ReactNode } from "react"
import { PlatformAdminGuard } from "@/components/auth/platform-admin-guard"
import { usePathname } from "next/navigation"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/platform-admin/login'

  // Don't protect the login page - it should be accessible without auth
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <PlatformAdminGuard redirectTo="/platform-admin/login">
      {children}
    </PlatformAdminGuard>
  )
}
