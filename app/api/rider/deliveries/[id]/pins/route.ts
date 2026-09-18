import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"
import * as riderModel from "@/lib/models/rider"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header is required" },
        { status: 401 }
      )
    }

    const idToken = authHeader.substring(7)
    const currentRider = await riderModel.getCurrentRider(idToken)
    
    if (!currentRider) {
      return NextResponse.json(
        { error: "Rider not found or not authenticated" },
        { status: 401 }
      )
    }

    const deliveryPins = await deliveryModel.getDeliveryWithPinsForRider(currentRider.riderId, id)

    return NextResponse.json(deliveryPins, { status: 200 })
  } catch (error) {
    console.error("Error getting delivery PINs:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get delivery PINs",
      },
      { status: 400 }
    )
  }
}
