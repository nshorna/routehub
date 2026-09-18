import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deliveries = await deliveryModel.getRiderDeliveriesHistory(id)

    return NextResponse.json(deliveries, { status: 200 })
  } catch (error) {
    console.error("Error fetching rider delivery history:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch rider delivery history",
      },
      { status: 500 }
    )
  }
}

