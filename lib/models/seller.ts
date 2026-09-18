import { prisma } from "../prisma"
import { firebaseAuth } from "../firebase.server"

export async function getSellers() {
  const sellers = await prisma.seller.findMany({
    orderBy: { createdAt: "desc" },
  })

  return sellers.map((s) => ({
    id: s.id,
    businessName: s.businessName,
    contactName: s.contactName,
    phone: s.phone ?? "",
    email: s.businessEmail ?? "",
    pickupAddress: s.pickupAddress,
  }))
}

export async function getSellerById(sellerId: string) {
  const s = await prisma.seller.findUnique({
    where: { id: sellerId },
  })
  if (!s) return null

  return {
    id: s.id,
    businessName: s.businessName,
    contactName: s.contactName,
    phone: s.phone ?? "",
    email: s.businessEmail ?? "",
    pickupAddress: s.pickupAddress,
  }
}

export async function getAllSellers(searchQuery?: string) {
  const where = searchQuery
    ? {
        OR: [
          { businessName: { contains: searchQuery } },
          { contactName: { contains: searchQuery } },
          { businessEmail: { contains: searchQuery } },
        ],
      }
    : undefined

  return prisma.seller.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
    },
  })
}

export async function getSellerWithUsersById(sellerId: string) {
  return prisma.seller.findUnique({
    where: { id: sellerId },
    include: {
      roleAssignments: {
        include: {
          user: true,
        },
      },
    },
  })
}

/**
 * Get the current seller from a Firebase ID token.
 * Returns the sellerId if the user has seller accounts.
 */
export async function getCurrentSeller(idToken: string | null): Promise<{ sellerId: string; seller: any } | null> {
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
      sellerAccounts: {
        include: {
          seller: true,
        },
      },
    },
  })

  const sellerAccount = user?.sellerAccounts?.[0]
  if (!sellerAccount?.seller) return null

  return {
    sellerId: sellerAccount.seller.id,
    seller: sellerAccount.seller,
  }
}

export async function updateSellerStatus(
  sellerId: string,
  status: "PENDING_VERIFICATION" | "PENDING_INFORMATION_UPDATE" | "VERIFIED"
) {
  return prisma.seller.update({
    where: { id: sellerId },
    data: { status },
  })
}

