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

    // Check if user exists with this email as ID and has seller account
    const user = await prisma.user.findUnique({
      where: { id: email },
      include: {
        sellerAccounts: true,
      },
    })


    return NextResponse.json({
      exists: !!(user?.sellerAccounts?.length),
    })
  } catch (error) {
    console.error('Error checking seller email:', error)

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
