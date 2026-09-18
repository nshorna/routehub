import { NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      sellerId,
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      dropoffAddress,
      dropoffLatitude,
      dropoffLongitude,
      customerName,
      customerPhone,
      notes,
      fee,
    } = body ?? {}

    if (!pickupAddress || !dropoffAddress) {
      return NextResponse.json(
        { error: "pickupAddress and dropoffAddress are required" },
        { status: 400 },
      )
    }

    const numericFee = typeof fee === "number" ? fee : Number.parseFloat(String(fee ?? 0))

    const delivery = await deliveryModel.createDeliveryOrder({
      sellerId,
      pickupAddress,
      pickupLatitude: typeof pickupLatitude === "number" ? pickupLatitude : undefined,
      pickupLongitude: typeof pickupLongitude === "number" ? pickupLongitude : undefined,
      dropoffAddress,
      dropoffLatitude: typeof dropoffLatitude === "number" ? dropoffLatitude : undefined,
      dropoffLongitude: typeof dropoffLongitude === "number" ? dropoffLongitude : undefined,
      customerName,
      customerPhone,
      notes,
      fee: Number.isFinite(numericFee) && numericFee > 0 ? numericFee : 0,
    })

    return NextResponse.json({ delivery }, { status: 201 })
  } catch (error) {
    console.error("Error creating delivery order:", error)
    return NextResponse.json(
      { error: "Failed to create delivery order" },
      { status: 500 },
    )
  }
}

