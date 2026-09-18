import * as riderModel from "@/lib/models/rider"
import * as deliveryModel from "@/lib/models/delivery"
import { ActiveDelivery } from "@/components/rider/active-delivery"

export default async function RiderActivePage() {
  const riders = await riderModel.getRiders()
  const rider = riders[0]

  if (!rider) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Rider not found</p>
      </div>
    )
  }

  const delivery = await deliveryModel.getActiveDeliveryForRider(rider.id)

  return <ActiveDelivery delivery={delivery || undefined} />
}
