import { NextRequest, NextResponse } from "next/server"
import * as sellerModel from "@/lib/models/seller"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    const sellers = search
      ? await sellerModel.getAllSellers(search)
      : await sellerModel.getSellers()

    return NextResponse.json(sellers, { status: 200 })
  } catch (error) {
    console.error("Error fetching sellers:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch sellers",
      },
      { status: 500 }
    )
  }
}

