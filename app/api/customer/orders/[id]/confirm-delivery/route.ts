import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { pin, customerPhone } = body

    if (!pin || typeof pin !== "string") {
      return NextResponse.json(
        { error: "PIN is required" },
        { status: 400 }
      )
    }

    const delivery = await deliveryModel.confirmDeliveryWithPin(id, pin, customerPhone)

    return NextResponse.json({ delivery }, { status: 200 })
  } catch (error) {
    console.error("Error confirming delivery:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to confirm delivery",
      },
      { status: 400 }
    )
  }
}
