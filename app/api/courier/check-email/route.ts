import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = checkSchema.parse(body)

    // Check if user exists with this email as ID and has rider account
    const user = await prisma.user.findUnique({
      where: { id: email },
      include: {
        riderAccounts: {
          include: {
            rider: true,
          },
        },
      },
    })

    const hasRiderAccount = !!(user?.riderAccounts?.length)
    
    // If user exists but has no rider account, they can register
    // If user exists and has rider account, they should log in
    return NextResponse.json({
      exists: hasRiderAccount,
      hasAccount: hasRiderAccount,
      canRegister: !hasRiderAccount, // Can register if no rider account exists
    })
  } catch (error) {
    console.error('Error checking courier email:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    )
  }
}
