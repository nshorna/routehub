import * as riderModel from "@/lib/models/rider"
import * as deliveryModel from "@/lib/models/delivery"
import { HistoryPayouts } from "@/components/rider/history-payouts"

export default async function RiderHistoryPage() {
  const riders = await riderModel.getRiders()
  const rider = riders[0]

  if (!rider) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Rider not found</p>
      </div>
    )
  }

  const deliveries = await deliveryModel.getDeliveriesByRiderId(rider.id)
  return <HistoryPayouts deliveries={deliveries} />
}
