import { NextResponse } from "next/server"
import * as customerModel from "@/lib/models/customer"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body ?? {}

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "phone is required" },
        { status: 400 },
      )
    }

    const customer = await customerModel.findCustomerByPhone(phone)

    return NextResponse.json(
      {
        customer: customer
          ? {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
            }
          : null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error looking up customer by phone:", error)
    return NextResponse.json(
      { error: "Failed to lookup customer" },
      { status: 500 },
    )
  }
}

