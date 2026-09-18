import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ status: string }> }
) {
  try {
    const { status } = await params
    const validStatuses = ["PENDING", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"]
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const deliveries = await deliveryModel.getDeliveriesByStatus(
      status as "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
    )

    return NextResponse.json(deliveries, { status: 200 })
  } catch (error) {
    console.error("Error fetching deliveries by status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch deliveries",
      },
      { status: 500 }
    )
  }
}

