import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        downloads: true,
      },
    })

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Purchases fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}