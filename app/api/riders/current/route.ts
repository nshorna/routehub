import { NextRequest, NextResponse } from "next/server"
import * as riderModel from "@/lib/models/rider"

export async function GET(request: NextRequest) {
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

    return NextResponse.json(currentRider, { status: 200 })
  } catch (error) {
    console.error("Error fetching current rider:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch current rider",
      },
      { status: 500 }
    )
  }
}

