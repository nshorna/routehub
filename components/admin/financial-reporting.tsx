"use client"

import type { Delivery } from "@/lib/types"
import { AdminNav } from "./admin-nav"
import { BarChart3, DollarSign } from "lucide-react"
import { useState, useMemo } from "react"

interface RiderFinancialData {
  id: string
  name: string
  deliveries: number
  earnings: number
  pendingPayout: number
}

interface FinancialReportingProps {
  deliveries: Delivery[]
  riderFinancialData: RiderFinancialData[]
}

export function FinancialReporting({ deliveries, riderFinancialData }: FinancialReportingProps) {
  const [dateRange, setDateRange] = useState("month")

  const financialSummary = useMemo(() => {
    const completedDeliveries = deliveries.filter((d) => d.status === "delivered")
    const totalRevenue = completedDeliveries.reduce((sum, d) => sum + d.fee, 0)
    const platformCommission = totalRevenue * 0.2
    const riderPayouts = totalRevenue * 0.8
    const pendingPayouts = riderFinancialData.reduce((sum, r) => sum + r.pendingPayout, 0)

    return {
      totalRevenue,
      platformCommission,
      riderPayouts,
      pendingPayouts,
      completedCount: completedDeliveries.length,
    }
  }, [deliveries, riderFinancialData])

  return (
    <div className="flex h-screen bg-background">
      <AdminNav />

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Financial Reporting</h1>
          <p className="text-muted-foreground mb-6">Revenue, payouts, and financial analytics</p>

          {/* Date Range Filter */}
          <div className="mb-6">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-border rounded-lg px-4 py-2 text-foreground bg-background"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {/* Financial Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Revenue */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">${financialSummary.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">{financialSummary.completedCount} deliveries</p>
            </div>

            {/* Platform Commission */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Platform Commission</h3>
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">${financialSummary.platformCommission.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">20% commission</p>
            </div>

            {/* Rider Payouts */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Rider Payouts</h3>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">${financialSummary.riderPayouts.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">80% to riders</p>
            </div>

            {/* Pending Payouts */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Pending Payouts</h3>
                <DollarSign className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-3xl font-bold text-foreground">${financialSummary.pendingPayouts.toFixed(2)}</p>
              <p className="text-xs text-destructive mt-2 font-semibold">To be withdrawn</p>
            </div>
          </div>

          {/* Rider Payouts Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Rider Payout Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Rider Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Deliveries</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total Earned</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Pending Payout</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riderFinancialData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No rider financial data available
                      </td>
                    </tr>
                  ) : (
                    riderFinancialData.map((rider) => (
                      <tr key={rider.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{rider.name}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{rider.deliveries}</td>
                        <td className="px-6 py-4 text-sm font-bold text-primary">${rider.earnings.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-foreground">
                          ${rider.pendingPayout.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                            Pending
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
