"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu } from "lucide-react"
import { useState } from "react"
import { APP_NAME } from "@/lib/constants"

interface NavItem {
  label: string
  href: string
  icon?: ReactNode
  badge?: number
}

interface RoleLayoutProps {
  children: ReactNode
  role: "rider" | "seller" | "customer" | "admin"
  navItems: NavItem[]
  title: string
  onLogout?: () => void
  isMobile?: boolean
}

export function RoleLayout({ children, role, navItems, title, onLogout, isMobile = false }: RoleLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar/Navigation */}
      <div
        className={`${
          isMobile && !mobileMenuOpen ? "hidden" : ""
        } w-full md:w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-all`}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">{APP_NAME}</h1>
          <p className="text-sm text-sidebar-accent capitalize">{role}</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        {onLogout && (
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (Mobile) */}
        <div className="md:hidden bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-muted rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
