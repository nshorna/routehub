import * as deliveryModel from "@/lib/models/delivery"
import { TrackingPage } from "@/components/customer/tracking-page"

export default async function CustomerTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const delivery = await deliveryModel.getDeliveryByOrderId(id)

  return <TrackingPage delivery={delivery} orderId={id} />
}
