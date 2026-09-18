"use client"

import type { Delivery } from "@/lib/types"
import { RiderNav } from "./rider-nav"
import { DollarSign, TrendingUp } from "lucide-react"
import { useState, useMemo } from "react"

interface HistoryPayoutsProps {
  deliveries: Delivery[]
}

export function HistoryPayouts({ deliveries }: HistoryPayoutsProps) {
  const [sortBy, setSortBy] = useState<"date" | "fee">("date")

  const completedDeliveries = useMemo(() => {
    const completed = deliveries.filter((d) => d.status === "delivered")
    if (sortBy === "date") {
      return completed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    return completed.sort((a, b) => b.fee - a.fee)
  }, [deliveries, sortBy])

  const totalPending = completedDeliveries.reduce((sum, d) => sum + d.fee, 0)

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <RiderNav />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">History & Payouts</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Track your completed deliveries and earnings
          </p>

          {/* Summary Cards - responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Completed Deliveries</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{completedDeliveries.length}</p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Pending Payout</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">${totalPending.toFixed(2)}</p>
                </div>
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mb-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "fee")}
              className="w-full md:w-auto bg-background border border-border rounded-lg px-4 py-2 text-sm md:text-base text-foreground"
            >
              <option value="date">Sort by Date (Newest)</option>
              <option value="fee">Sort by Fee (Highest)</option>
            </select>
          </div>

          {/* Deliveries Table - scrollable on mobile */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                      Order ID
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                      Date
                    </th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                      From
                    </th>
                    <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-foreground">
                      To
                    </th>
                    <th className="px-3 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-foreground">
                      Fee Earned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {completedDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="px-3 md:px-6 py-3 text-xs md:text-sm font-semibold text-foreground">
                        {delivery.orderId}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-xs md:text-sm text-foreground">
                        {delivery.createdAt.toLocaleDateString()}
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-6 py-3 text-xs md:text-sm text-muted-foreground truncate">
                        {delivery.pickupAddress}
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-6 py-3 text-xs md:text-sm text-muted-foreground truncate">
                        {delivery.dropoffAddress}
                      </td>
                      <td className="px-3 md:px-6 py-3 text-xs md:text-sm font-bold text-[#009688] text-right">
                        ${delivery.fee.toFixed(2)}
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
