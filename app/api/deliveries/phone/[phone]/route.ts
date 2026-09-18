import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params
    const deliveries = await deliveryModel.getDeliveriesByPhone(decodeURIComponent(phone))

    return NextResponse.json(deliveries, { status: 200 })
  } catch (error) {
    console.error("Error fetching deliveries by phone:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch deliveries",
      },
      { status: 500 }
    )
  }
}

