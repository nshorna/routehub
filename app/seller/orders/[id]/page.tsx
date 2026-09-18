import * as deliveryModel from "@/lib/models/delivery"
import { TrackingPage } from "@/components/customer/tracking-page"

export default async function SellerOrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const delivery = await deliveryModel.getDeliveryByOrderId(id)

  // Reuse the customer-facing tracking UI but enable pickup confirmation for sellers
  return <TrackingPage delivery={delivery ?? undefined} orderId={id} backHref="/seller/orders" backLabel="Back to Orders" showPickupConfirmation={true} />
}

