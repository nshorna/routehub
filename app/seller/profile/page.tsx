import * as sellerModel from "@/lib/models/seller"
import { SellerProfile } from "@/components/seller/profile"

export default async function SellerProfilePage() {
  const sellers = await sellerModel.getSellers()
  const seller = sellers[0]

  if (!seller) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Seller not found</p>
      </div>
    )
  }

  return <SellerProfile seller={seller} />
}
