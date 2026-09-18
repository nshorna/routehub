import { NextRequest, NextResponse } from "next/server"
import * as deliveryModel from "@/lib/models/delivery"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    const deliveries = search
      ? await deliveryModel.getDeliveriesWithSearch(search)
      : await deliveryModel.getDeliveries()

    return NextResponse.json(deliveries, { status: 200 })
  } catch (error) {
    console.error("Error fetching deliveries:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch deliveries",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const delivery = await deliveryModel.createDeliveryOrder(body)
    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error("Error creating delivery:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create delivery",
      },
      { status: 400 }
    )
  }
}

