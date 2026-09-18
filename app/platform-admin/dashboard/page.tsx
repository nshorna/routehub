import * as platformAdminModel from "@/lib/models/platform-admin"
import { AdminDashboard } from "@/components/admin/dashboard"

export default async function AdminDashboardPage() {
  const stats = await platformAdminModel.getDashboardStats()

  return (
    <AdminDashboard
      totalDeliveriesToday={stats.totalDeliveriesToday}
      totalRevenue={stats.totalRevenue}
      activeRiders={stats.activeRiders}
      deliveryStatusCounts={stats.deliveryStatusCounts}
      avgDeliveryTimeMinutes={stats.avgDeliveryTimeMinutes}
      successRate={stats.successRate}
    />
  )
}
