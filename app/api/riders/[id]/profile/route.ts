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
        { error: "You can only update your own profile" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updated = await riderModel.updateRiderProfile(id, body)

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("Error updating rider profile:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update rider profile",
      },
      { status: 400 }
    )
  }
}

