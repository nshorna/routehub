import { notFound } from "next/navigation"
import * as deliveryModel from "@/lib/models/delivery"
import { TrackingPage } from "@/components/customer/tracking-page"

interface OrderDetailPageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = params instanceof Promise ? await params : params
  const delivery = await deliveryModel.getDeliveryById(resolvedParams.id)

  if (!delivery) {
    notFound()
  }

  // Use the generic tracking page for a consistent order detail view.
  // Admin-specific edit/delete actions remain available from the list view.
  return (
    <TrackingPage
      delivery={delivery}
      orderId={delivery.orderId}
      backHref="/platform-admin/orders"
      backLabel="Back to Orders"
      role="platform-admin"
    />
  )
}



