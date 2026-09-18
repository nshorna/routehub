import { NextRequest, NextResponse } from "next/server"
import * as sellerModel from "@/lib/models/seller"
import { verifyPlatformAdmin } from "@/lib/auth-utils"

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
    await verifyPlatformAdmin(idToken)

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["PENDING_VERIFICATION", "PENDING_INFORMATION_UPDATE", "VERIFIED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PENDING_VERIFICATION, PENDING_INFORMATION_UPDATE, or VERIFIED" },
        { status: 400 }
      )
    }

    const updated = await sellerModel.updateSellerStatus(
      id,
      status as "PENDING_VERIFICATION" | "PENDING_INFORMATION_UPDATE" | "VERIFIED"
    )

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("Error updating seller status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update seller status",
      },
      { status: 400 }
    )
  }
}

