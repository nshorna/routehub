"use client"

import type { Seller as PrismaSeller, SellerStatus } from "@/lib/generated/prisma/client"
import { useState, useEffect, useRef } from "react"
import { AdminNav } from "./admin-nav"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, Store, User as UserIcon, Calendar, Search } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

type SellerWithUsers = PrismaSeller & {
  roleAssignments: Array<{
    id: string
    user: {
      id: string
      name: string
      phone: string | null
    }
    role: string
  }>
}

interface SellerRegistrationsProps {
  sellers: SellerWithUsers[]
  initialSearch?: string
}

export function SellerRegistrations({ sellers, initialSearch = "" }: SellerRegistrationsProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const lastSearchRef = useRef(initialSearch)

  // Update local state when initialSearch changes (from URL)
  useEffect(() => {
    if (initialSearch !== lastSearchRef.current) {
      setSearchQuery(initialSearch)
      lastSearchRef.current = initialSearch
    }
  }, [initialSearch])

  // Debounced search - update URL after user stops typing
  useEffect(() => {
    const trimmedQuery = searchQuery.trim()
    
    // Skip if this is the same as what we last set
    if (lastSearchRef.current === trimmedQuery) {
      return
    }

    const timer = setTimeout(() => {
      // Double-check the current URL state before updating
      const currentParams = new URLSearchParams(window.location.search)
      const urlSearch = currentParams.get("search") || ""
      
      // Only update if different from current URL
      if (urlSearch !== trimmedQuery) {
        const params = new URLSearchParams()
        if (trimmedQuery) {
          params.set("search", trimmedQuery)
        }
        // Use replace instead of push to avoid adding to history and prevent loops
        const newUrl = `${pathname}${trimmedQuery ? `?${params.toString()}` : ""}`
        router.replace(newUrl, { scroll: false })
        lastSearchRef.current = trimmedQuery
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, pathname, router])

  const getStatusBadge = (status: SellerStatus) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">Pending Verification</Badge>
      case "PENDING_INFORMATION_UPDATE":
        return <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">Pending Information Update</Badge>
      case "VERIFIED":
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Verified</Badge>
      case "INACTIVE":
        return <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-400">Inactive</Badge>
      case "ACTIVE":
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400">Active</Badge>
      case "SUSPENDED":
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSellerClick = (seller: SellerWithUsers) => {
    router.push(`/platform-admin/seller-registrations/${seller.id}`)
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminNav />

      <main className="flex-1 overflow-auto p-4 md:p-6">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Seller Registrations</h1>
            <p className="text-muted-foreground">
              Review and manage seller accounts on the platform.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by business name, contact name, or business email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sellers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map((seller) => (
              <Card
                key={seller.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSellerClick(seller)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-3 rounded-lg">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{seller.businessName}</h3>
                        <p className="text-sm text-muted-foreground">Contact: {seller.contactName}</p>
                      </div>
                    </div>
                    {getStatusBadge(seller.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    {seller.businessEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground break-all">{seller.businessEmail}</span>
                      </div>
                    )}
                    {seller.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{seller.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        Created {new Date(seller.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Pickup address</p>
                    <p className="line-clamp-2">{seller.pickupAddress}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sellers.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No sellers found matching your search." : "No sellers found."}
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
