import { NextRequest, NextResponse } from "next/server"
import * as riderModel from "@/lib/models/rider"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stats = await riderModel.getRiderDashboardStats(id)

    if (!stats) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 })
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error("Error fetching rider dashboard stats:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch rider dashboard stats",
      },
      { status: 500 }
    )
  }
}

