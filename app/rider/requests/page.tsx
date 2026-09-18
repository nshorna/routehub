import * as deliveryModel from "@/lib/models/delivery"
import { RequestsList } from "@/components/rider/requests-list"

export default async function RiderRequestsPage() {
  const pendingRequests = await deliveryModel.getRiderRequests()

  return <RequestsList requests={pendingRequests} />
}
