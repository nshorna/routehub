"use client"

import type { Rider } from "@/lib/types"
import { RiderNav } from "./rider-nav"
import { ToggleSwitch } from "@/components/shared/toggle-switch"
import { MapPin, TrendingUp, CheckCircle, Package } from "lucide-react"
import { useState } from "react"
import { NotificationBanner } from "@/components/shared/notification-banner"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface RiderDashboardProps {
  rider: Rider
  completedToday: number
  newRequestsCount: number
  activeDeliveryCount: number
}

export function RiderDashboard({ rider, completedToday, newRequestsCount, activeDeliveryCount }: RiderDashboardProps) {
  const { getIdToken } = useAuth()
  const [isOnline, setIsOnline] = useState(rider.isOnline)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const handleToggleOnline = async (newStatus: boolean) => {
    setIsUpdatingStatus(true)
    
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/riders/${rider.id}/online-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ isOnline: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update online status")
      }

      setIsOnline(newStatus)
      setNotification({
        message: `You are now ${newStatus ? "online" : "offline"}`,
        type: "success",
      })
    } catch (error) {
      console.error("Failed to update online status:", error)
      setNotification({
        message: error instanceof Error ? error.message : "Failed to update status. Please try again.",
        type: "error",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <RiderNav />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back, {rider.name.split(" ")[0]}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your deliveries and earnings</p>
        </div>

        {/* Online/Offline Toggle */}
        <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">Status</h2>
            <p className={`text-xs md:text-sm ${isOnline ? "text-primary" : "text-muted-foreground"}`}>
              {isOnline ? "Online and accepting deliveries" : "Offline - not accepting deliveries"}
            </p>
          </div>
          <ToggleSwitch isOn={isOnline} onChange={handleToggleOnline} disabled={isUpdatingStatus} />
        </div>

        {/* Stats Grid - responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Today's Earnings */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Today's Earnings</h3>
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {/* Approximate per-delivery earnings based on rider totals */}
              ${((rider.earnings / Math.max(rider.completedDeliveries || 1, 1)) * completedToday).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {completedToday} deliver{completedToday === 1 ? "" : "ies"} completed today
            </p>
          </div>

          {/* Total Deliveries Completed */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Total Deliveries</h3>
              <Package className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{rider.completedDeliveries}</p>
            <p className="text-xs text-muted-foreground mt-2">Completed deliveries</p>
          </div>

          {/* Total Earnings */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Total Earnings</h3>
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">${rider.earnings.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">All-time earnings</p>
          </div>

          {/* Pending Payout */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Pending Payout</h3>
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-accent-foreground" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">${rider.pendingPayout.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">Ready for withdrawal</p>
          </div>
        </div>

        {/* Quick Actions - full width on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Link
            href="/rider/requests"
            className="bg-primary text-primary-foreground rounded-lg p-4 md:p-6 hover:bg-primary/90 transition-colors"
          >
            <h3 className="text-base md:text-lg font-semibold mb-1">View New Requests</h3>
            <p className="text-xs md:text-sm text-primary-foreground">
              {newRequestsCount} new deliver{newRequestsCount === 1 ? "y" : "ies"} available
            </p>
          </Link>

          <Link
            href="/rider/active"
            className="bg-accent text-accent-foreground rounded-lg p-4 md:p-6 hover:bg-accent/90 transition-colors"
          >
            <h3 className="text-base md:text-lg font-semibold mb-1">View Active Delivery</h3>
            <p className="text-xs md:text-sm text-accent-foreground">
              {activeDeliveryCount === 0
                ? "No delivery in progress"
                : `${activeDeliveryCount} delivery in progress`}
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}
