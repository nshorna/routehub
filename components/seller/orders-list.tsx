"use client"

import type { Delivery, Rider } from "@/lib/types"
import { SellerNav } from "./seller-nav"
import { Eye, Filter } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface OrdersListProps {
  deliveries: Delivery[]
  riders: Rider[]
}

export function OrdersList({ deliveries, riders }: OrdersListProps) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const handleLogout = async () => {
    try {
      localStorage.removeItem('selectedSellerAccountId')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  const filteredDeliveries = useMemo(() => {
    if (statusFilter === "all") return deliveries
    return deliveries.filter((d) => d.status === statusFilter)
  }, [deliveries, statusFilter])

  const getRiderName = (riderId?: string) => {
    if (!riderId) return "Not Assigned"
    return riders.find((r) => r.id === riderId)?.name || "Unknown"
  }

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: "bg-accent text-accent-foreground",
      "picked-up": "bg-secondary text-secondary-foreground",
      "in-transit": "bg-primary text-primary-foreground",
      delivered: "bg-primary/90 text-primary-foreground",
      cancelled: "bg-destructive text-destructive-foreground",
    }
    return colors[status as keyof typeof colors] || "bg-gray-200"
  }

  const handleViewDetails = (delivery: Delivery) => {
    // Navigate to dedicated tracking route for this order
    router.push(`/seller/orders/${delivery.orderId}`)
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <SellerNav onLogout={handleLogout} />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Orders & Tracking</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Manage and track all your deliveries
          </p>

          {/* Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto border border-border rounded-lg px-4 py-2 text-sm md:text-base text-foreground bg-background"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="picked-up">Picked Up</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Orders Table - scrollable on mobile */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-foreground">Order ID</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-foreground">Date</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left font-semibold text-foreground">
                      Rider
                    </th>
                    <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left font-semibold text-foreground">
                      Destination
                    </th>
                    <th className="px-3 md:px-6 py-3 text-center font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-6 py-3 font-semibold text-foreground">{delivery.orderId}</td>
                      <td className="px-3 md:px-6 py-3 text-foreground">{delivery.createdAt.toLocaleDateString()}</td>
                      <td className="px-3 md:px-6 py-3">
                        <span
                          className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(delivery.status)}`}
                        >
                          {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace("-", " ")}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-6 py-3 text-foreground">
                        {getRiderName(delivery.riderId)}
                      </td>
                      <td className="hidden md:table-cell px-3 md:px-6 py-3 text-muted-foreground truncate">
                        {delivery.dropoffAddress}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-center">
                        <button
                          onClick={() => handleViewDetails(delivery)}
                          className="flex items-center justify-center gap-1 mx-auto bg-primary text-primary-foreground px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm hover:bg-primary/90 transition-colors"
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Track</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          
        </div>
      </main>
    </div>
  )
}
