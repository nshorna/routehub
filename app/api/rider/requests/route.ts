import { NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function GET() {
  try {
    const requests = await deliveryModel.getRiderRequests()
    return NextResponse.json(requests, { status: 200 })
  } catch (error) {
    console.error("Error fetching rider requests:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch rider requests",
      },
      { status: 500 }
    )
  }
}
