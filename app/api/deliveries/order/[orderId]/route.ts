import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const delivery = await deliveryModel.getDeliveryByOrderId(orderId)

    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    return NextResponse.json(delivery, { status: 200 })
  } catch (error) {
    console.error("Error fetching delivery:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch delivery",
      },
      { status: 500 }
    )
  }
}

