import { NextRequest, NextResponse } from "next/server"
import * as customerModel from "@/lib/models/customer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name } = body

    if (!phone) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      )
    }

    const customer = await customerModel.upsertCustomerByPhone({ phone, name })
    return NextResponse.json(customer, { status: 200 })
  } catch (error) {
    console.error("Error upserting customer:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upsert customer",
      },
      { status: 400 }
    )
  }
}

