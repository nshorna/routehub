import { NextResponse } from "next/server"
import * as riderModel from "@/lib/models/rider"

export async function GET() {
  try {
    const riders = await riderModel.getRiders()
    return NextResponse.json(riders, { status: 200 })
  } catch (error) {
    console.error("Error fetching riders:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch riders",
      },
      { status: 500 }
    )
  }
}

