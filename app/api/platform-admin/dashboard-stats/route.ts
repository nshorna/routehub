import { NextRequest, NextResponse } from "next/server"
import * as platformAdminModel from "@/lib/models/platform-admin"
import { verifyPlatformAdmin } from "@/lib/auth-utils"

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
    await verifyPlatformAdmin(idToken)

    const stats = await platformAdminModel.getDashboardStats()
    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch dashboard stats",
      },
      { status: 500 }
    )
  }
}

