import { NextRequest, NextResponse } from "next/server"
import * as riderModel from "@/lib/models/rider"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rider = await riderModel.getRiderById(id)

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 })
    }

    return NextResponse.json(rider, { status: 200 })
  } catch (error) {
    console.error("Error fetching rider:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch rider",
      },
      { status: 500 }
    )
  }
}

