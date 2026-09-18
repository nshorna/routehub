import { prisma } from "../prisma"
import { firebaseAuth } from "../firebase.server"
import { mapRider } from "./mappers"
import type { Rider as RiderType } from "../types"

export async function getRiders(): Promise<RiderType[]> {
  const riders = await prisma.rider.findMany({
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
      deliveries: {
        where: {
          status: "DELIVERED",
        },
      },
    },
  })
  
  return Promise.all(riders.map(mapRider))
}

export async function getRiderById(riderId: string): Promise<RiderType | null> {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
      deliveries: {
        where: {
          status: "DELIVERED",
        },
      },
    },
  })
  
  if (!rider) return null
  return mapRider(rider)
}

export async function getOnlineRiders(): Promise<RiderType[]> {
  const riders = await prisma.rider.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
      deliveries: {
        where: {
          status: "DELIVERED",
        },
      },
    },
  })
  
  return Promise.all(riders.map(mapRider))
}

export async function getRiderFinancialData() {
  const riders = await prisma.rider.findMany({
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
      deliveries: {
        where: {
          status: "DELIVERED",
        },
      },
    },
  })

  return riders.map((rider) => {
    const user = rider.roleAssignments[0]?.user
    const name = user?.name || rider.ghanaCardName || "Unknown"
    
    // Calculate earnings: 80% of delivery fees for delivered orders
    const totalEarned = rider.deliveries.reduce((sum, delivery) => {
      return sum + Number(delivery.fee) * 0.8
    }, 0)

    return {
      id: rider.id,
      name,
      deliveries: rider.deliveries.length,
      earnings: totalEarned,
      pendingPayout: totalEarned, // For now, pending payout equals total earned
    }
  })
}

/**
 * Resolve the currently authenticated rider from a Firebase ID token.
 * Returns the Rider mapped to RiderType, along with the underlying riderId.
 */
export async function getCurrentRider(idToken: string | null): Promise<{ riderId: string; rider: RiderType } | null> {
  if (!idToken) return null

  // Verify token and get email/phone
  const decoded = await firebaseAuth.verifyIdToken(idToken)
  const email = decoded.email
  const phone = decoded.phone_number || null

  if (!email && !phone) {
    return null
  }

  const userId = email || phone!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      riderAccounts: {
        include: {
          rider: {
            include: {
              roleAssignments: {
                include: { user: true },
              },
              deliveries: {
                where: { status: "DELIVERED" },
              },
            },
          },
        },
      },
    },
  })

  const riderAccount = user?.riderAccounts?.[0]
  if (!riderAccount?.rider) return null

  const mappedRider = await mapRider(riderAccount.rider)

  return {
    riderId: riderAccount.rider.id,
    rider: mappedRider,
  }
}

export async function getRiderDashboardStats(riderId: string) {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
      deliveries: {
        where: {
          status: "DELIVERED",
        },
      },
    },
  })

  if (!rider) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const completedToday = await prisma.delivery.count({
    where: {
      riderId,
      status: "DELIVERED",
      createdAt: {
        gte: today,
      },
    },
  })

  const mappedRider = await mapRider(rider)

  return {
    rider: mappedRider,
    completedToday,
  }
}

export async function updateRiderProfile(
  riderId: string,
  input: {
    name?: string
    phone?: string
    email?: string
    bikeInfo?: string
    ghanaCardName?: string
    ghanaCardNumber?: string
    dateOfBirth?: string
    licenseNumber?: string
    licenseExpiration?: string
    hasSmartphone?: boolean
    hasGhanaNumber?: boolean
  }
): Promise<RiderType> {
  const updatedRider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      phone: input.phone,
      email: input.email,
      bikeInfo: input.bikeInfo,
      ghanaCardName: input.ghanaCardName,
      ghanaCardNumber: input.ghanaCardNumber,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      licenseNumber: input.licenseNumber,
      licenseExpiration: input.licenseExpiration ? new Date(input.licenseExpiration) : null,
      hasSmartphone: input.hasSmartphone ?? false,
      hasGhanaNumber: input.hasGhanaNumber ?? false,
    },
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
      deliveries: {
        where: {
          status: "DELIVERED",
        },
      },
    },
  })

  // If a name is provided, also update the linked User record
  if (input.name) {
    const userId = updatedRider.roleAssignments?.[0]?.userId
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: input.name },
      })
      // Refresh the updatedRider with latest user relation
      const refreshedRider = await prisma.rider.findUnique({
        where: { id: riderId },
        include: {
          roleAssignments: {
            include: {
              user: true,
            },
          },
          deliveries: {
            where: {
              status: "DELIVERED",
            },
          },
        },
      })
      if (refreshedRider) {
        return mapRider(refreshedRider)
      }
    }
  }

  return mapRider(updatedRider)
}

export async function updateRiderOnlineStatus(riderId: string, isOnline: boolean) {
  return prisma.rider.update({
    where: { id: riderId },
    data: {
      isOnline,
      lastOnlineAt: isOnline ? new Date() : undefined,
      ...(isOnline ? { status: "ACTIVE" as const } : {}),
    },
  })
}

