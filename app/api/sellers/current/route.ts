import { NextRequest, NextResponse } from "next/server"
import * as sellerModel from "@/lib/models/seller"

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
    const currentSeller = await sellerModel.getCurrentSeller(idToken)

    if (!currentSeller) {
      return NextResponse.json(
        { error: "Seller not found or not authenticated" },
        { status: 401 }
      )
    }

    return NextResponse.json(currentSeller, { status: 200 })
  } catch (error) {
    console.error("Error fetching current seller:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch current seller",
      },
      { status: 500 }
    )
  }
}

