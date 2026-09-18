import * as deliveryModel from "@/lib/models/delivery"
import * as riderModel from "@/lib/models/rider"
import { AdminOrdersManagement } from "@/components/admin/orders-management"

export default async function AdminOrdersPage() {
  const [deliveries, riders] = await Promise.all([deliveryModel.getDeliveries(), riderModel.getRiders()])
  return <AdminOrdersManagement deliveries={deliveries} riders={riders} />
}
