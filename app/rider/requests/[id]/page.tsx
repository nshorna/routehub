import * as deliveryModel from "@/lib/models/delivery"
import { RequestDetail } from "@/components/rider/request-detail"
import { notFound } from "next/navigation"

export default async function RiderRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const delivery = await deliveryModel.getDeliveryById(id)

  if (!delivery) {
    notFound()
  }

  // Only show pending deliveries that haven't been assigned
  if (delivery.status !== "pending" || delivery.riderId) {
    notFound()
  }

  return <RequestDetail delivery={delivery} />
}
