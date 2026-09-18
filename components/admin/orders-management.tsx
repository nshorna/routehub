"use client"

import type { Delivery, Rider } from "@/lib/types"
import { AdminNav } from "./admin-nav"
import { Search } from "lucide-react"
import { useState, useEffect, useTransition, useRef } from "react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"

interface OrdersManagementProps {
  deliveries: Delivery[]
  riders: Rider[]
}

export function AdminOrdersManagement({ deliveries: initialDeliveries, riders }: OrdersManagementProps) {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedOrder, setSelectedOrder] = useState<Delivery | null>(null)
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>(initialDeliveries)
  const [isPending, startTransition] = useTransition()
  const isFirstMount = useRef(true)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    // Skip initial mount if search is empty (we already have initial deliveries)
    if (isFirstMount.current && !debouncedSearchQuery) {
      isFirstMount.current = false
      return
    }
    isFirstMount.current = false
    
    startTransition(async () => {
      const url = debouncedSearchQuery 
        ? `/api/deliveries?search=${encodeURIComponent(debouncedSearchQuery)}`
        : `/api/deliveries`
      const response = await fetch(url)
      if (!response.ok) {
        console.error("Failed to fetch deliveries")
        return
      }
      const results = await response.json()
      setFilteredDeliveries(results)
    })
  }, [debouncedSearchQuery])

  const getRiderName = (riderId?: string) => {
    if (!riderId) return "Not Assigned"
    return riders.find((r) => r.id === riderId)?.name || "Unknown"
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-accent text-accent-foreground",
      "picked-up": "bg-primary/80 text-primary-foreground",
      "in-transit": "bg-primary text-primary-foreground",
      delivered: "bg-primary text-primary-foreground",
      cancelled: "bg-destructive text-destructive-foreground",
    }
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <AdminNav />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Order Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Monitor and manage all platform deliveries
          </p>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search orders by ID, status, rider, seller, address, or fee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                disabled={isPending}
              />
              {isPending && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Orders Table - scrollable on mobile */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-foreground">Order ID</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-foreground">Date</th>
                    <th className="px-3 md:px-6 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left font-semibold text-foreground">
                      Seller
                    </th>
                    <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left font-semibold text-foreground">
                      Rider
                    </th>
                    <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left font-semibold text-foreground">
                      Fee
                    </th>
                    <th className="px-3 md:px-6 py-3 text-center font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 md:px-6 py-3 font-semibold text-foreground text-xs md:text-sm">
                        {delivery.orderId}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-foreground text-xs md:text-sm">
                        {delivery.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-3 md:px-6 py-3">
                        <span
                          className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}
                        >
                          {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1).replace("-", " ")}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-6 py-3 text-foreground text-xs md:text-sm">
                        Seller {delivery.sellerId?.slice(-1)}
                      </td>
                      <td className="hidden md:table-cell px-3 md:px-6 py-3 text-foreground text-xs md:text-sm">
                        {getRiderName(delivery.riderId)}
                      </td>
                      <td className="hidden lg:table-cell px-3 md:px-6 py-3 font-semibold text-primary text-xs md:text-sm">
                        ${delivery.fee.toFixed(2)}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-center">
                        <button
                          onClick={() => setSelectedOrder(delivery)}
                          className="text-primary hover:underline font-medium text-xs md:text-sm"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-border max-w-2xl w-full p-4 md:p-6 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-foreground">{selectedOrder.orderId}</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-muted-foreground hover:text-foreground text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3 md:space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}
                      >
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1).replace("-", " ")}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Created</p>
                      <p className="text-sm md:text-base text-foreground font-semibold">
                        {selectedOrder.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Pickup</p>
                    <p className="text-sm md:text-base text-foreground font-semibold break-words">
                      {selectedOrder.pickupAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Drop-off</p>
                    <p className="text-sm md:text-base text-foreground font-semibold break-words">
                      {selectedOrder.dropoffAddress}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Fee</p>
                      <p className="text-base md:text-lg text-foreground font-bold text-primary">
                        ${selectedOrder.fee.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Rider</p>
                      <p className="text-sm md:text-base text-foreground font-semibold">
                        {getRiderName(selectedOrder.riderId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Seller ID</p>
                      <p className="text-sm md:text-base text-foreground font-semibold">{selectedOrder.sellerId}</p>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm md:text-base text-foreground">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold text-sm md:text-base hover:bg-primary/90 transition-colors">
                    Modify Rider
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-muted text-muted-foreground py-2 rounded-lg font-semibold text-sm md:text-base hover:bg-muted/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
