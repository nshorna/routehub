import * as riderModel from "@/lib/models/rider"
import * as deliveryModel from "@/lib/models/delivery"
import { RiderDashboard } from "@/components/rider/dashboard"

export default async function RiderDashboardPage() {
  const riders = await riderModel.getRiders()
  const rider = riders[0]

  if (!rider) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Rider not found</p>
      </div>
    )
  }

  const [stats, requests, activeDelivery] = await Promise.all([
    riderModel.getRiderDashboardStats(rider.id),
    deliveryModel.getRiderRequests(),
    deliveryModel.getActiveDeliveryForRider(rider.id),
  ])

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Unable to load dashboard stats</p>
      </div>
    )
  }

  return (
    <RiderDashboard
      rider={stats.rider}
      completedToday={stats.completedToday}
      newRequestsCount={requests.length}
      activeDeliveryCount={activeDelivery ? 1 : 0}
    />
  )
}
