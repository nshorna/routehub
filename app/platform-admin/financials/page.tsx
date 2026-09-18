import * as deliveryModel from "@/lib/models/delivery"
import * as riderModel from "@/lib/models/rider"
import { FinancialReporting } from "@/components/admin/financial-reporting"

export default async function FinancialsPage() {
  const [deliveries, riderFinancialData] = await Promise.all([deliveryModel.getDeliveries(), riderModel.getRiderFinancialData()])
  return <FinancialReporting deliveries={deliveries} riderFinancialData={riderFinancialData} />
}
