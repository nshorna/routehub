import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"
import * as riderModel from "@/lib/models/rider"
import type { DeliveryStatus } from "@/lib/generated/prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    const updated = await deliveryModel.updateDeliveryStatusAuthenticated(
      currentRider.riderId,
      id,
      status as DeliveryStatus
    )

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("Error updating delivery status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update delivery status",
      },
      { status: 400 }
    )
  }
}

