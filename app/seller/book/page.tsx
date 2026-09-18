import * as sellerModel from "@/lib/models/seller"
import { NewBooking } from "@/components/seller/new-booking"

export default async function SellerBookPage() {
  const sellers = await sellerModel.getSellers()
  const seller = sellers[0]

  if (!seller) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Seller not found</p>
      </div>
    )
  }

  return <NewBooking seller={seller} />
}
