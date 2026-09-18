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

    const existingSellerUser = await prisma.user.findFirst({
      where: {
        email,
        role: 'SELLER',
      },
    })

    return NextResponse.json({
      exists: !!existingSellerUser,
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
