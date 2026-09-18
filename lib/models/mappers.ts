import type { Delivery as DeliveryModel, DeliveryStatus } from "../generated/prisma/client"
import type { Delivery, Rider as RiderType } from "../types"

// Helper function to convert status from Prisma format to mock data format
export function convertStatus(status: DeliveryStatus): "pending" | "picked-up" | "in-transit" | "delivered" | "cancelled" {
  const statusMap: Record<DeliveryStatus, "pending" | "picked-up" | "in-transit" | "delivered" | "cancelled"> = {
    PENDING: "pending",
    PICKED_UP: "picked-up",
    IN_TRANSIT: "in-transit",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  }
  return statusMap[status] || "pending"
}

// Map Prisma Delivery to the Delivery interface from types.ts
export function mapDelivery(model: DeliveryModel): Delivery {
  return {
    id: model.id,
    orderId: model.orderId,
    pickupAddress: model.pickupAddress,
    pickupLatitude: model.pickupLatitude ? Number(model.pickupLatitude) : undefined,
    pickupLongitude: model.pickupLongitude ? Number(model.pickupLongitude) : undefined,
    dropoffAddress: model.dropoffAddress,
    dropoffLatitude: model.dropoffLatitude ? Number(model.dropoffLatitude) : undefined,
    dropoffLongitude: model.dropoffLongitude ? Number(model.dropoffLongitude) : undefined,
    fee: Number(model.fee),
    status: convertStatus(model.status),
    createdAt: model.createdAt,
    riderId: model.riderId ?? undefined,
    customerId: model.customerId ?? undefined,
    customerPhone: model.customerPhone ?? undefined,
    sellerId: model.sellerId ?? undefined,
    notes: model.notes ?? undefined,
  }
}

// Helper function to convert role from Prisma format to mock data format
export function convertRole(role: string): "rider" | "seller" | "customer" | "admin" {
  const roleMap: Record<string, "rider" | "seller" | "customer" | "admin"> = {
    RIDER: "rider",
    SELLER: "seller",
    CUSTOMER: "customer",
    ADMIN: "admin",
  }
  return roleMap[role] || "customer"
}

// Map Prisma Rider to the Rider interface from types.ts
export async function mapRider(rider: any): Promise<RiderType> {
  const user = rider.roleAssignments?.[0]?.user
  const name = user?.name || rider.ghanaCardName || "Unknown"
  
  // Calculate earnings: 80% of delivery fees for delivered orders
  const deliveredDeliveries = rider.deliveries?.filter((d: any) => d.status === "DELIVERED") || []
  const earnings = deliveredDeliveries.reduce((sum: number, delivery: any) => {
    return sum + Number(delivery.fee) * 0.8
  }, 0)
  
  return {
    id: rider.id,
    name,
    phone: rider.phone || "",
    email: rider.email || "",
    bikeInfo: rider.bikeInfo || "",
    ghanaCardName: rider.ghanaCardName || "",
    ghanaCardNumber: rider.ghanaCardNumber || "",
    dateOfBirth: rider.dateOfBirth ? rider.dateOfBirth.toISOString().slice(0, 10) : "",
    licenseNumber: rider.licenseNumber || "",
    licenseExpiration: rider.licenseExpiration ? rider.licenseExpiration.toISOString().slice(0, 10) : "",
    hasSmartphone: rider.hasSmartphone ?? false,
    hasGhanaNumber: rider.hasGhanaNumber ?? false,
    status: rider.status,
    earnings,
    completedDeliveries: deliveredDeliveries.length,
    isOnline: rider.status === "ACTIVE",
    pendingPayout: earnings, // For now, pending payout equals total earned
  }
}

