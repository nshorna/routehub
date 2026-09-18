import { NextRequest, NextResponse } from "next/server"
import * as customerModel from "@/lib/models/customer"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params
    const customer = await customerModel.findCustomerByPhone(decodeURIComponent(phone))

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer, { status: 200 })
  } catch (error) {
    console.error("Error fetching customer by phone:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch customer",
      },
      { status: 500 }
    )
  }
}

