import { NextRequest, NextResponse } from "next/server"
import * as riderModel from "@/lib/models/rider"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const financialData = await riderModel.getRiderFinancialData()
    const riderData = financialData.find((r) => r.id === id)

    if (!riderData) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 })
    }

    return NextResponse.json(riderData, { status: 200 })
  } catch (error) {
    console.error("Error fetching rider financial data:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch rider financial data",
      },
      { status: 500 }
    )
  }
}

