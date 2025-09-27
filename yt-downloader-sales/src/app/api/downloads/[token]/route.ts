import { NextRequest, NextResponse } from 'next/server'
import { verifyDownloadToken, recordDownload } from '@/lib/downloads'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const tokenPayload = verifyDownloadToken(token)

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired download token' },
        { status: 401 }
      )
    }

    // Verify purchase exists and is valid
    const purchase = await prisma.purchase.findUnique({
      where: { id: tokenPayload.purchaseId },
      include: { downloads: true }
    })

    if (!purchase || purchase.userId !== tokenPayload.userId) {
      return NextResponse.json(
        { error: 'Invalid purchase' },
        { status: 404 }
      )
    }

    if (purchase.status !== 'completed') {
      return NextResponse.json(
        { error: 'Purchase not completed' },
        { status: 400 }
      )
    }

    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Download link expired' },
        { status: 410 }
      )
    }

    if (purchase.downloads.length >= purchase.maxDownloads) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 429 }
      )
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'
    const userAgent = request.headers.get('user-agent')

    // Record the download
    const downloadRecorded = await recordDownload(
      purchase.id,
      clientIP,
      userAgent || undefined
    )

    if (!downloadRecorded) {
      return NextResponse.json(
        { error: 'Failed to record download' },
        { status: 500 }
      )
    }

    // Serve the file
    try {
      const filePath = join(process.cwd(), 'files', `${purchase.productName}-${purchase.productVersion}.dmg`)
      const fileBuffer = await readFile(filePath)

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${purchase.productName}-${purchase.productVersion}.dmg"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}