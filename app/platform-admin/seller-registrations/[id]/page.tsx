import { notFound } from "next/navigation"
import * as sellerModel from "@/lib/models/seller"
import { SellerRegistrationDetail } from "@/components/admin/seller-registration-detail"

interface SellerRegistrationDetailPageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default async function SellerRegistrationDetailPage({ params }: SellerRegistrationDetailPageProps) {
  const resolvedParams = params instanceof Promise ? await params : params
  const seller = await sellerModel.getSellerWithUsersById(resolvedParams.id)

  if (!seller) {
    notFound()
  }

  return <SellerRegistrationDetail seller={seller} />
}

