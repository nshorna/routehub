import { prisma } from "../prisma"
import type { DeliveryStatus } from "../generated/prisma/client"
import { mapDelivery, convertStatus } from "./mappers"
import { normalizePhoneTo233 } from "../utils"
import { sendDeliveryStatusNotification } from "../notifications"
import type { Delivery } from "../types"

export async function getDeliveries(): Promise<Delivery[]> {
  const deliveries = await prisma.delivery.findMany({
    orderBy: { createdAt: "desc" },
  })
  return deliveries.map(mapDelivery)
}

export async function getDeliveriesWithSearch(searchQuery?: string): Promise<Delivery[]> {
  const query = searchQuery?.trim().toLowerCase() || ""
  
  if (!query) {
    return getDeliveries()
  }

  // Build status filter array
  const statusFilters: string[] = []
  if (query.includes("pending")) statusFilters.push("PENDING")
  if (query.includes("picked") || query.includes("pick")) statusFilters.push("PICKED_UP")
  if (query.includes("transit") || query.includes("in transit")) statusFilters.push("IN_TRANSIT")
  if (query.includes("delivered") || query.includes("deliver")) statusFilters.push("DELIVERED")
  if (query.includes("cancelled") || query.includes("cancel")) statusFilters.push("CANCELLED")

  // Build OR conditions array
  const orConditions: any[] = [
    { orderId: { contains: query, mode: "insensitive" } },
    { pickupAddress: { contains: query, mode: "insensitive" } },
    { dropoffAddress: { contains: query, mode: "insensitive" } },
    { notes: { contains: query, mode: "insensitive" } },
    { customerPhone: { contains: query, mode: "insensitive" } },
    // Search by seller business name (via relation)
    {
      seller: {
        businessName: { contains: query, mode: "insensitive" },
      },
    },
    // Search by rider ghana card name (via relation)
    {
      rider: {
        ghanaCardName: { contains: query, mode: "insensitive" },
      },
    },
  ]

  // Add status filter if any status matches
  if (statusFilters.length > 0) {
    orConditions.push({
      status: {
        in: statusFilters,
      },
    })
  }

  // Add fee filter if query contains numbers
  if (/\d/.test(query)) {
    const numQuery = Number(query)
    if (!isNaN(numQuery)) {
      orConditions.push({
        fee: {
          gte: numQuery - 0.01,
          lte: numQuery + 0.01,
        },
      })
    }
  }

  // Build Prisma where clause with OR conditions for multiple fields
  const deliveries = await prisma.delivery.findMany({
    where: {
      OR: orConditions,
    },
    include: {
      seller: true,
      rider: true,
    },
    orderBy: { createdAt: "desc" },
  })
  
  return deliveries.map(mapDelivery)
}

export async function getDeliveryByOrderId(orderId: string): Promise<Delivery | null> {
  const delivery = await prisma.delivery.findUnique({
    where: { orderId },
  })
  return delivery ? mapDelivery(delivery) : null
}

export async function getDeliveryById(deliveryId: string): Promise<Delivery | null> {
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  })
  return delivery ? mapDelivery(delivery) : null
}

export async function getDeliveriesByStatus(status: "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"): Promise<Delivery[]> {
  const deliveries = await prisma.delivery.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
  })
  return deliveries.map(mapDelivery)
}

export async function getDeliveriesByRiderId(riderId: string): Promise<Delivery[]> {
  const deliveries = await prisma.delivery.findMany({
    where: { riderId },
    orderBy: { createdAt: "desc" },
  })
  return deliveries.map(mapDelivery)
}

export async function getDeliveriesBySellerId(sellerId: string): Promise<Delivery[]> {
  const deliveries = await prisma.delivery.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  })
  return deliveries.map(mapDelivery)
}

export async function getDeliveriesByPhone(phone: string): Promise<Delivery[]> {
  // Normalize phone number to +233 format for comparison
  const normalizedInput = normalizePhoneTo233(phone)

  // We store phones in +233 format; normalize stored phones for comparison
  const deliveries = await prisma.delivery.findMany({
    orderBy: { createdAt: "desc" },
  })

  const filtered = deliveries.filter((d) => {
    if (!d.customerPhone) return false
    const normalizedStored = normalizePhoneTo233(d.customerPhone)
    return normalizedStored === normalizedInput
  })

  return filtered.map(mapDelivery)
}

export async function getActiveDeliveryForRider(riderId: string): Promise<Delivery | null> {
  const delivery = await prisma.delivery.findFirst({
    where: {
      riderId,
      status: {
        in: ["PENDING", "PICKED_UP", "IN_TRANSIT"],
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return delivery ? mapDelivery(delivery) : null
}

export async function getRiderRequests(): Promise<Delivery[]> {
  const deliveries = await prisma.delivery.findMany({
    where: {
      riderId: null,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  })

  return deliveries.map(mapDelivery)
}

export async function getRiderDeliveriesHistory(riderId: string): Promise<Delivery[]> {
  const deliveries = await prisma.delivery.findMany({
    where: {
      riderId,
      status: "DELIVERED",
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return deliveries.map(mapDelivery)
}

// Generate a simple 4-digit PIN
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function createDeliveryOrder(input: {
  sellerId?: string
  pickupAddress: string
  pickupLatitude?: number
  pickupLongitude?: number
  dropoffAddress: string
  dropoffLatitude?: number
  dropoffLongitude?: number
  customerName?: string
  customerPhone?: string
  notes?: string
  fee: number
}): Promise<Delivery> {
  // Generate a simple external order ID like ORD-20251218-ABC123
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const orderId = `ORD-${datePart}-${random}`

  let customerId: string | undefined
  const normalizedPhone = input.customerPhone ? normalizePhoneTo233(input.customerPhone) : undefined

  // Import customer model function
  const { upsertCustomerByPhone } = await import("./customer")
  if (normalizedPhone) {
    const customer = await upsertCustomerByPhone({
      phone: normalizedPhone,
      name: input.customerName,
    })
    customerId = customer.id
  }

  // Generate confirmation PINs
  const pickupConfirmationPin = generatePin()
  const deliveryConfirmationPin = generatePin()

  const delivery = await prisma.delivery.create({
    data: {
      orderId,
      pickupAddress: input.pickupAddress,
      pickupLatitude: input.pickupLatitude != null ? input.pickupLatitude : null,
      pickupLongitude: input.pickupLongitude != null ? input.pickupLongitude : null,
      dropoffAddress: input.dropoffAddress,
      dropoffLatitude: input.dropoffLatitude != null ? input.dropoffLatitude : null,
      dropoffLongitude: input.dropoffLongitude != null ? input.dropoffLongitude : null,
      customerPhone: normalizedPhone,
      notes: input.notes,
      fee: input.fee,
      status: "PENDING",
      sellerId: input.sellerId,
      customerId,
      pickupConfirmationPin,
      deliveryConfirmationPin,
    },
  })

  return mapDelivery(delivery)
}

export async function updateDeliveryStatus(
  riderId: string,
  deliveryId: string,
  newStatus: DeliveryStatus
): Promise<Delivery> {
  // Ensure this delivery belongs to the rider
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  })

  if (!delivery || delivery.riderId !== riderId) {
    throw new Error("Delivery not found for this rider")
  }

  const data: any = {
    status: newStatus,
  }

  if (newStatus === "DELIVERED") {
    data.completedAt = new Date()
  }

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data,
  })

  return mapDelivery(updated)
}

export async function confirmPickupWithPin(
  sellerId: string,
  orderId: string,
  pin: string
): Promise<Delivery> {
  const delivery = await prisma.delivery.findUnique({
    where: { orderId },
  })

  if (!delivery) {
    throw new Error("Delivery not found")
  }

  // Verify seller owns this delivery
  if (delivery.sellerId !== sellerId) {
    throw new Error("You don't have permission to confirm pickup for this order")
  }

  // Verify PIN
  if (delivery.pickupConfirmationPin !== pin) {
    throw new Error("Invalid pickup confirmation PIN")
  }

  // Verify status is PENDING
  if (delivery.status !== "PENDING") {
    throw new Error(`Cannot confirm pickup. Current status is ${delivery.status}`)
  }

  // Update status to PICKED_UP
  const updated = await prisma.delivery.update({
    where: { id: delivery.id },
    data: {
      status: "PICKED_UP",
    },
  })

  // Send notification
  sendDeliveryStatusNotification(delivery.id, "PICKED_UP").catch((error) => {
    console.error("Failed to send delivery status notification:", error)
  })

  return mapDelivery(updated)
}

export async function confirmDeliveryWithPin(
  orderId: string,
  pin: string,
  customerPhone?: string
): Promise<Delivery> {
  const delivery = await prisma.delivery.findUnique({
    where: { orderId },
  })

  if (!delivery) {
    throw new Error("Delivery not found")
  }

  // Verify customer phone matches if provided
  if (customerPhone) {
    const normalizedPhone = normalizePhoneTo233(customerPhone)
    if (delivery.customerPhone && normalizePhoneTo233(delivery.customerPhone) !== normalizedPhone) {
      throw new Error("Phone number does not match this order")
    }
  }

  // Verify PIN
  if (delivery.deliveryConfirmationPin !== pin) {
    throw new Error("Invalid delivery confirmation PIN")
  }

  // Verify status allows delivery confirmation (must be IN_TRANSIT or PICKED_UP)
  if (delivery.status !== "IN_TRANSIT" && delivery.status !== "PICKED_UP") {
    throw new Error(`Cannot confirm delivery. Current status is ${delivery.status}`)
  }

  // Update status to DELIVERED
  const updated = await prisma.delivery.update({
    where: { id: delivery.id },
    data: {
      status: "DELIVERED",
      completedAt: new Date(),
    },
  })

  // Send notification
  sendDeliveryStatusNotification(delivery.id, "DELIVERED").catch((error) => {
    console.error("Failed to send delivery status notification:", error)
  })

  return mapDelivery(updated)
}

export async function getDeliveryWithPinsForRider(
  riderId: string,
  orderId: string
): Promise<{ orderId: string; pickupConfirmationPin: string | null; deliveryConfirmationPin: string | null; status: string }> {
  const delivery = await prisma.delivery.findUnique({
    where: { orderId },
  })

  if (!delivery) {
    throw new Error("Delivery not found")
  }

  // Verify this delivery belongs to the rider
  if (delivery.riderId !== riderId) {
    throw new Error("You don't have permission to view this delivery")
  }

  return {
    orderId: delivery.orderId,
    pickupConfirmationPin: delivery.pickupConfirmationPin,
    deliveryConfirmationPin: delivery.deliveryConfirmationPin,
    status: convertStatus(delivery.status),
  }
}

export async function acceptDeliveryRequest(
  riderId: string,
  deliveryId: string
): Promise<Delivery> {
  // Check if delivery exists and is available
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  })

  if (!delivery) {
    throw new Error("Delivery not found")
  }

  if (delivery.riderId) {
    throw new Error("Delivery already assigned to another rider")
  }

  if (delivery.status !== "PENDING") {
    throw new Error("Delivery is not available for acceptance")
  }

  // Assign the rider to the delivery
  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      riderId,
    },
  })

  return mapDelivery(updated)
}

export async function rejectDeliveryRequest(
  riderId: string,
  deliveryId: string
): Promise<{ success: boolean }> {
  // Verify delivery exists
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  })

  if (!delivery) {
    throw new Error("Delivery not found")
  }

  // For now, rejection is just a no-op
  // In the future, we could track rejections or implement other logic
  return { success: true }
}

export async function updateDeliveryStatusAuthenticated(
  riderId: string,
  deliveryId: string,
  newStatus: DeliveryStatus
): Promise<Delivery> {
  // Ensure this delivery belongs to the rider
  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
  })

  if (!delivery || delivery.riderId !== riderId) {
    throw new Error("Delivery not found for this rider")
  }

  // Riders cannot directly change status to PICKED_UP or DELIVERED
  // Only sellers can confirm pickup with PIN, and only customers can confirm delivery with PIN
  if (newStatus === "PICKED_UP" || newStatus === "DELIVERED") {
    throw new Error(`Riders cannot directly change status to ${newStatus}. Use PIN confirmation instead.`)
  }

  // Validate status transitions (riders can only mark as IN_TRANSIT after pickup is confirmed)
  const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
    PENDING: [], // Riders cannot change from PENDING - seller must confirm pickup with PIN
    PICKED_UP: ["IN_TRANSIT"], // Rider can mark as IN_TRANSIT after seller confirms pickup
    IN_TRANSIT: [], // Riders cannot change from IN_TRANSIT - customer must confirm delivery with PIN
    DELIVERED: [],
    CANCELLED: [],
  }

  const allowedNextStatuses = validTransitions[delivery.status] || []
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${delivery.status} to ${newStatus}`)
  }

  const data: any = {
    status: newStatus,
  }

  // Note: completedAt is set when customer confirms delivery with PIN, not here

  const updated = await prisma.delivery.update({
    where: { id: deliveryId },
    data,
  })

  // Send notification to customer about status change
  // Don't await to avoid blocking the response
  sendDeliveryStatusNotification(deliveryId, newStatus).catch((error) => {
    console.error("Failed to send delivery status notification:", error)
  })

  return mapDelivery(updated)
}

