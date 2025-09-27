import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateDownloadToken } from '@/lib/downloads'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tokenSchema = z.object({
  purchaseId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { purchaseId } = tokenSchema.parse(body)

    // Verify purchase belongs to user
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { downloads: true }
    })

    if (!purchase || purchase.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    if (purchase.status !== 'completed') {
      return NextResponse.json(
        { error: 'Purchase not completed' },
        { status: 400 }
      )
    }

    if (purchase.downloads.length >= purchase.maxDownloads) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 429 }
      )
    }

    const token = generateDownloadToken(purchaseId, session.user.id)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate download token' },
      { status: 500 }
    )
  }
}