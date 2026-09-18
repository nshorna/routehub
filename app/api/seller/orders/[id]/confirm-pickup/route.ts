import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"
import * as sellerModel from "@/lib/models/seller"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { pin } = body

    if (!pin || typeof pin !== "string") {
      return NextResponse.json(
        { error: "PIN is required" },
        { status: 400 }
      )
    }

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

    const delivery = await deliveryModel.confirmPickupWithPin(currentSeller.sellerId, id, pin)

    return NextResponse.json({ delivery }, { status: 200 })
  } catch (error) {
    console.error("Error confirming pickup:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to confirm pickup",
      },
      { status: 400 }
    )
  }
}
