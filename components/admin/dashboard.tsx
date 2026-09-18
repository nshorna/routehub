"use client"

import { AdminNav } from "./admin-nav"
import { TrendingUp, Activity } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NotificationBanner } from "@/components/shared/notification-banner"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface AdminDashboardProps {
  totalDeliveriesToday: number
  totalRevenue: number
  activeRiders: number
  deliveryStatusCounts: {
    PENDING: number
    PICKED_UP: number
    IN_TRANSIT: number
    DELIVERED: number
    CANCELLED: number
  }
  avgDeliveryTimeMinutes: number
  successRate: number
}

export function AdminDashboard({
  totalDeliveriesToday,
  totalRevenue,
  activeRiders,
  deliveryStatusCounts,
  avgDeliveryTimeMinutes,
  successRate,
}: AdminDashboardProps) {
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      setNotification({
        message: "Failed to log out",
        type: "error",
      })
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <AdminNav onLogout={handleLogout} />

      <main className="flex-1 overflow-auto p-4 md:p-6 mt-16 md:mt-0">
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Platform Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">Real-time overview of your delivery network</p>
          </div>

          {/* Metrics Grid - responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {/* Total Deliveries Today */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Deliveries Today</h3>
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{totalDeliveriesToday}</p>
              <p className="text-xs text-primary mt-2 font-semibold">All statuses</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-primary mt-2 font-semibold">Commission earned</p>
            </div>

            {/* Active Riders */}
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs md:text-sm font-medium text-muted-foreground">Active Riders</h3>
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{activeRiders}</p>
              <p className="text-xs text-muted-foreground mt-2">Online now</p>
            </div>

          </div>

          {/* Delivery Status Chart */}
          <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">Delivery Status Distribution</h2>
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px] md:h-[400px]"
            >
              <BarChart
                data={[
                  {
                    status: "Pending",
                    count: deliveryStatusCounts.PENDING,
                  },
                  {
                    status: "Picked Up",
                    count: deliveryStatusCounts.PICKED_UP,
                  },
                  {
                    status: "In Transit",
                    count: deliveryStatusCounts.IN_TRANSIT,
                  },
                  {
                    status: "Delivered",
                    count: deliveryStatusCounts.DELIVERED,
                  },
                  {
                    status: "Cancelled",
                    count: deliveryStatusCounts.CANCELLED,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-1))" />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Avg Delivery Time</h3>
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {avgDeliveryTimeMinutes > 0 ? `${avgDeliveryTimeMinutes} min` : "N/A"}
              </p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Delivery Success Rate</h3>
              <p className="text-xl md:text-2xl font-bold text-primary">{successRate.toFixed(1)}%</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 md:p-6">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Total Deliveries</h3>
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {Object.values(deliveryStatusCounts).reduce((a, b) => a + b, 0)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
