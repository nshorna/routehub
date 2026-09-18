import { prisma } from "../prisma"
import { convertRole } from "./mappers"

export async function getPendingUsers() {
  const [pendingRiders, pendingSellers] = await Promise.all([
    prisma.rider.findMany({
      where: {
        status: "PENDING_APPROVAL",
      },
      include: {
        roleAssignments: {
          include: {
            user: true,
          },
        },
      },
    }),
    prisma.seller.findMany({
      where: {
        status: "PENDING_VERIFICATION",
      },
      include: {
        roleAssignments: {
          include: {
            user: true,
          },
        },
      },
    }),
  ])
  
  const users: Array<{
    id: string
    name: string
    email: string
    phone: string
    role: "rider" | "seller" | "customer" | "admin"
    status: "pending" | "approved" | "rejected"
    createdAt: Date
  }> = []
  
  // Map pending riders
  for (const rider of pendingRiders) {
    const user = rider.roleAssignments[0]?.user
    users.push({
      id: rider.id,
      name: user?.name || rider.ghanaCardName || "Unknown",
      email: rider.email || "",
      phone: rider.phone || "",
      role: "rider",
      status: "pending",
      createdAt: rider.createdAt,
    })
  }
  
  // Map pending sellers
  for (const seller of pendingSellers) {
    const user = seller.roleAssignments[0]?.user
    users.push({
      id: seller.id,
      name: user?.name || seller.contactName || "Unknown",
      email: seller.businessEmail || "",
      phone: seller.phone || "",
      role: "seller",
      status: "pending",
      createdAt: seller.createdAt,
    })
  }
  
  return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getPendingUsersByRole(role: "RIDER" | "SELLER" | "CUSTOMER" | "ADMIN") {
  const allPending = await getPendingUsers()
  const convertedRole = convertRole(role)
  return allPending.filter((u) => u.role === convertedRole)
}

export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const deliveriesToday = await prisma.delivery.count({
    where: {
      createdAt: {
        gte: today,
      },
    },
  })

  const revenueAgg = await prisma.delivery.aggregate({
    _sum: { fee: true },
  })

  const totalRevenue = Number(revenueAgg._sum.fee ?? 0)

  // Get active riders from database
  const activeRiders = await prisma.rider.count({
    where: {
      status: "ACTIVE",
    },
  })

  // Get delivery status counts for chart
  const deliveryStatusCounts = await prisma.delivery.groupBy({
    by: ["status"],
    _count: {
      status: true,
    },
  })

  const statusCounts = {
    PENDING: 0,
    PICKED_UP: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  }

  deliveryStatusCounts.forEach((item) => {
    statusCounts[item.status] = item._count.status
  })

  // Calculate average delivery time (for delivered orders)
  const deliveredDeliveries = await prisma.delivery.findMany({
    where: {
      status: "DELIVERED",
      createdAt: {
        gte: today,
      },
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  })

  let avgDeliveryTimeMinutes = 0
  if (deliveredDeliveries.length > 0) {
    const totalMinutes = deliveredDeliveries.reduce((sum, delivery) => {
      const diffMs = delivery.updatedAt.getTime() - delivery.createdAt.getTime()
      return sum + diffMs / (1000 * 60) // Convert to minutes
    }, 0)
    avgDeliveryTimeMinutes = Math.round(totalMinutes / deliveredDeliveries.length)
  }

  // Calculate delivery success rate
  const [totalDeliveries, deliveredCount] = await Promise.all([
    prisma.delivery.count(),
    prisma.delivery.count({
      where: {
        status: "DELIVERED",
      },
    }),
  ])

  const successRate = totalDeliveries > 0 ? (deliveredCount / totalDeliveries) * 100 : 0

  return {
    totalDeliveriesToday: deliveriesToday,
    totalRevenue,
    activeRiders,
    deliveryStatusCounts: statusCounts,
    avgDeliveryTimeMinutes,
    successRate,
  }
}

