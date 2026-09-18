import { NextResponse } from "next/server"
import * as customerModel from "@/lib/models/customer"
import { prisma } from "@/lib/prisma"
import { normalizePhoneTo233 } from "@/lib/utils"

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

    const normalizedPhone = normalizePhoneTo233(phone)
    const customer = await customerModel.findCustomerByPhone(normalizedPhone)

    if (!customer) {
      return NextResponse.json({
        addresses: [],
      })
    }

    // Get all addresses for this customer
    const addresses = await prisma.address.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      addresses: addresses.map((addr) => ({
        id: addr.id,
        name: addr.name,
        description: addr.description,
        latitude: addr.latitude.toNumber(),
        longitude: addr.longitude.toNumber(),
      })),
    })
  } catch (error) {
    console.error("Error fetching customer addresses:", error)
    return NextResponse.json(
      { error: "Failed to fetch customer addresses" },
      { status: 500 },
    )
  }
}

