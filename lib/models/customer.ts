import { prisma } from "../prisma"
import { normalizePhoneTo233 } from "../utils"

export async function findCustomerByPhone(phone: string) {
  if (!phone) return null
  const normalizedPhone = normalizePhoneTo233(phone)
  return prisma.customer.findFirst({
    where: { phone: normalizedPhone },
  })
}

export async function upsertCustomerByPhone(input: { phone: string; name?: string }) {
  const normalizedPhone = normalizePhoneTo233(input.phone)
  const existing = await findCustomerByPhone(normalizedPhone)
  if (existing) {
    if (input.name && input.name !== existing.name) {
      return prisma.customer.update({
        where: { id: existing.id },
        data: { name: input.name },
      })
    }
    return existing
  }

  return prisma.customer.create({
    data: {
      phone: normalizedPhone,
      name: input.name,
    },
  })
}

