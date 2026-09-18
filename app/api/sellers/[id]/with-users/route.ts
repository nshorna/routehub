import { NextRequest, NextResponse } from "next/server"
import * as sellerModel from "@/lib/models/seller"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const seller = await sellerModel.getSellerWithUsersById(id)

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    return NextResponse.json(seller, { status: 200 })
  } catch (error) {
    console.error("Error fetching seller with users:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch seller with users",
      },
      { status: 500 }
    )
  }
}

