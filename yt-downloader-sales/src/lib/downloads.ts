import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const DOWNLOAD_TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || 'fallback-secret'

export interface DownloadTokenPayload {
  purchaseId: string
  userId: string
  exp: number
}

export function generateDownloadToken(purchaseId: string, userId: string): string {
  const payload: DownloadTokenPayload = {
    purchaseId,
    userId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  }

  return jwt.sign(payload, DOWNLOAD_TOKEN_SECRET)
}

export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  try {
    return jwt.verify(token, DOWNLOAD_TOKEN_SECRET) as DownloadTokenPayload
  } catch {
    return null
  }
}

export async function recordDownload(
  purchaseId: string,
  ipAddress: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { downloads: true }
    })

    if (!purchase) return false

    if (purchase.downloads.length >= purchase.maxDownloads) {
      return false
    }

    await prisma.$transaction([
      prisma.download.create({
        data: {
          purchaseId,
          ipAddress,
          userAgent: userAgent || 'unknown',
        },
      }),
      prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          downloadCount: { increment: 1 },
        },
      }),
    ])

    return true
  } catch {
    return false
  }
}