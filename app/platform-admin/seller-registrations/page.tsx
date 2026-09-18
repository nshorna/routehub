import * as sellerModel from "@/lib/models/seller"
import { SellerRegistrations } from "@/components/admin/seller-registrations"

interface SellerRegistrationsPageProps {
  searchParams: Promise<{ search?: string }> | { search?: string }
}

export default async function SellerRegistrationsPage({ searchParams }: SellerRegistrationsPageProps) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams
  const searchQuery = params.search || ""
  const sellers = await sellerModel.getAllSellers(searchQuery)
  return <SellerRegistrations sellers={sellers} initialSearch={searchQuery} />
}

