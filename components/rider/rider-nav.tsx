"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, MapPin, History, User, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { APP_NAME } from "@/lib/constants"
import { useAuth } from "@/lib/auth-context"

export function RiderNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      router.push("/")
    }
  }

  const navItems = [
    { label: "Dashboard", href: "/rider/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "New Requests", href: "/rider/requests", icon: <Package className="w-5 h-5" /> },
    { label: "Active Delivery", href: "/rider/active", icon: <MapPin className="w-5 h-5" /> },
    { label: "History & Payouts", href: "/rider/history", icon: <History className="w-5 h-5" /> },
    { label: "Profile", href: "/rider/profile", icon: <User className="w-5 h-5" /> },
  ]

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-sidebar-border flex items-center justify-between px-4 z-50">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{APP_NAME}</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static fixed left-0 top-16 md:top-0 w-64 bg-white dark:bg-gray-900 border-r border-sidebar-border flex flex-col h-[calc(100vh-64px)] md:h-screen transition-transform duration-300 z-40`}
      >
        {/* Header - hidden on mobile */}
        <div className="p-4 border-b border-sidebar-border hidden md:block">
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-sm text-sidebar-accent">Rider</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href) 
                  ? "bg-primary text-primary-foreground [&_svg]:text-primary-foreground" 
                  : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 [&_svg]:text-gray-900 dark:[&_svg]:text-gray-100"
              }`}
            >
              {item.icon}
              <span className="flex-1 font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium text-sm [&_svg]:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-30" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
