import * as deliveryModel from "@/lib/models/delivery"
import * as riderModel from "@/lib/models/rider"
import { OrdersList } from "@/components/seller/orders-list"

export default async function SellerOrdersPage() {
  const [deliveries, riders] = await Promise.all([deliveryModel.getDeliveries(), riderModel.getRiders()])
  return <OrdersList deliveries={deliveries} riders={riders} />
}
