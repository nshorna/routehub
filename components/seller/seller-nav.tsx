"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Package, Plus, Store, LogOut, Menu, X, Building2, Check, ChevronDown, MapPin } from "lucide-react"
import { useState } from "react"
import { APP_NAME } from "@/lib/constants"
import { useSellerAccount } from "@/lib/seller-account-context"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function SellerNav({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { sellerAccounts, selectedSellerAccount, setSelectedSellerAccount } = useSellerAccount()
  const { signOut } = useAuth()

  const handleAccountSwitch = (accountId: string) => {
    const account = sellerAccounts.find(acc => acc.seller.id === accountId)
    if (account) {
      setSelectedSellerAccount(account)
      // Refresh the page to reflect the new account
      router.refresh()
    }
  }

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      try {
        // Clear selected seller account from localStorage
        localStorage.removeItem('selectedSellerAccountId')
        await signOut()
        router.push('/seller/login')
      } catch (error) {
        console.error('Failed to log out:', error)
      }
    }
  }

  const navItems = [
    { label: "Orders", href: "/seller/orders", icon: <Package className="w-5 h-5" /> },
    { label: "New Booking", href: "/seller/book", icon: <Plus className="w-5 h-5" /> },
    { label: "Addresses", href: "/seller/addresses", icon: <MapPin className="w-5 h-5" /> },
    { label: "Store Profile", href: "/seller/profile", icon: <Store className="w-5 h-5" /> },
  ]

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-sidebar-border flex items-center justify-between px-4 z-50">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{APP_NAME}</h1>
          {selectedSellerAccount && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {selectedSellerAccount.seller.businessName}
            </p>
          )}
        </div>
        {sellerAccounts.length > 1 && selectedSellerAccount && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="mr-2">
                <Building2 className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sellerAccounts.map((account) => {
                const isSelected = selectedSellerAccount?.seller.id === account.seller.id
                const status = account.seller.status
                const isActive = status === 'VERIFIED' || status === 'ACTIVE'
                
                return (
                  <DropdownMenuItem
                    key={account.seller.id}
                    onClick={() => handleAccountSwitch(account.seller.id)}
                    className="flex items-start gap-2 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                          {account.seller.businessName}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {account.seller.contactName}
                      </p>
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-gray-100">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static fixed left-0 top-16 md:top-0 w-64 bg-white dark:bg-gray-900 border-r border-sidebar-border flex flex-col h-[calc(100vh-64px)] md:h-screen transition-transform duration-300 z-40`}
      >
        <div className="p-4 border-b border-sidebar-border hidden md:block">
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-sm text-sidebar-accent mb-3">Seller</p>
          
          {/* Account Switcher */}
          {sellerAccounts.length > 1 && selectedSellerAccount && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-left h-auto py-2 px-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {selectedSellerAccount.seller.businessName}
                      </span>
                    </div>
                    <Badge
                      variant={
                        selectedSellerAccount.seller.status === 'VERIFIED' || 
                        selectedSellerAccount.seller.status === 'ACTIVE'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs mt-1"
                    >
                      {selectedSellerAccount.seller.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sellerAccounts.map((account) => {
                  const isSelected = selectedSellerAccount?.seller.id === account.seller.id
                  const status = account.seller.status
                  const isActive = status === 'VERIFIED' || status === 'ACTIVE'
                  
                  return (
                    <DropdownMenuItem
                      key={account.seller.id}
                      onClick={() => handleAccountSwitch(account.seller.id)}
                      className="flex items-start gap-2 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                          <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                            {account.seller.businessName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {account.seller.contactName}
                        </p>
                        <Badge
                          variant={isActive ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {sellerAccounts.length === 1 && selectedSellerAccount && (
            <div className="mt-2 p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-medium truncate">
                  {selectedSellerAccount.seller.businessName}
                </span>
              </div>
              <Badge
                variant={
                  selectedSellerAccount.seller.status === 'VERIFIED' || 
                  selectedSellerAccount.seller.status === 'ACTIVE'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs mt-1"
              >
                {selectedSellerAccount.seller.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}
        </div>

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
