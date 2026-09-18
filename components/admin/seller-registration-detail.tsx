"use client"

import type { Seller as PrismaSeller, SellerStatus } from "@/lib/generated/prisma/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "./admin-nav"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Store, User as UserIcon, Calendar, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

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

interface SellerRegistrationDetailProps {
  seller: SellerWithUsers
}

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

export function SellerRegistrationDetail({ seller: initialSeller }: SellerRegistrationDetailProps) {
  const [seller, setSeller] = useState<SellerWithUsers>(initialSeller)
  const [isUpdating, setIsUpdating] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const router = useRouter()
  const { getIdToken } = useAuth()

  const handleStatusUpdate = async (newStatus: "PENDING_VERIFICATION" | "PENDING_INFORMATION_UPDATE" | "VERIFIED") => {
    setIsUpdating(true)
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error("Not authenticated")
      }

      const response = await fetch(`/api/platform-admin/sellers/${seller.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update seller status")
      }

      const updated = await response.json()
      setSeller((prev) => ({ ...prev, status: updated.status }))
      setNotification({
        message: `Seller status updated to ${newStatus.replace(/_/g, " ")}`,
        type: "success",
      })
      router.refresh()
    } catch (error) {
      console.error("Error updating seller status:", error)
      setNotification({
        message: "Failed to update seller status",
        type: "error",
      })
    } finally {
      setIsUpdating(false)
    }
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

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  <Store className="w-6 h-6 text-primary" />
                  <span>{seller.businessName}</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Contact: {seller.contactName}
                </p>
              </div>
            </div>
            <div className="hidden md:block">{getStatusBadge(seller.status)}</div>
          </div>

          <div className="md:hidden">{getStatusBadge(seller.status)}</div>

          {/* Basic Information */}
          <section className="space-y-4 rounded-lg border border-border bg-card p-4 md:p-6">
            <h2 className="text-lg font-semibold text-foreground">Business Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seller.businessEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Email</p>
                    <p className="text-sm text-foreground break-all">{seller.businessEmail}</p>
                  </div>
                </div>
              )}
              {seller.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm text-foreground">{seller.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">
                    {new Date(seller.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm text-foreground">
                    {new Date(seller.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Pickup Address</p>
              <p className="text-sm text-foreground whitespace-pre-line">{seller.pickupAddress}</p>
            </div>
          </section>

          {/* Associated Users */}
          {seller.roleAssignments.length > 0 && (
            <section className="space-y-3 rounded-lg border border-border bg-card p-4 md:p-6">
              <h2 className="text-lg font-semibold text-foreground">Associated Users</h2>
              <div className="space-y-2">
                {seller.roleAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{assignment.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.user.id} {assignment.user.phone && `• ${assignment.user.phone}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {assignment.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Status Update */}
          <section className="space-y-3 rounded-lg border border-border bg-card p-4 md:p-6">
            <p className="text-sm font-medium text-foreground">Update Status</p>
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                type="button"
                variant={seller.status === "PENDING_VERIFICATION" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("PENDING_VERIFICATION")}
                disabled={isUpdating || seller.status === "PENDING_VERIFICATION"}
                className="flex-1"
              >
                Pending Verification
              </Button>
              <Button
                type="button"
                variant={seller.status === "PENDING_INFORMATION_UPDATE" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("PENDING_INFORMATION_UPDATE")}
                disabled={isUpdating || seller.status === "PENDING_INFORMATION_UPDATE"}
                className="flex-1"
              >
                Pending Info Update
              </Button>
              <Button
                type="button"
                variant={seller.status === "VERIFIED" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("VERIFIED")}
                disabled={isUpdating || seller.status === "VERIFIED"}
                className="flex-1"
              >
                Verified
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

