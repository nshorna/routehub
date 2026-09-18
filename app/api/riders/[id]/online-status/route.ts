import { NextRequest, NextResponse } from "next/server"
import * as riderModel from "@/lib/models/rider"

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
    if (currentRider.riderId !== id) {
      return NextResponse.json(
        { error: "You can only update your own online status" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isOnline } = body

    if (typeof isOnline !== "boolean") {
      return NextResponse.json(
        { error: "isOnline must be a boolean" },
        { status: 400 }
      )
    }

    const updated = await riderModel.updateRiderOnlineStatus(id, isOnline)

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("Error updating rider online status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update rider online status",
      },
      { status: 400 }
    )
  }
}

