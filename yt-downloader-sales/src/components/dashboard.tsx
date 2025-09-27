'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Purchase {
  id: string
  productName: string
  productVersion: string
  amount: number
  currency: string
  status: string
  downloadCount: number
  maxDownloads: number
  createdAt: string
  expiresAt: string | null
}

export function Dashboard() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('success')) {
      setPurchaseSuccess(true)
      // Remove success param from URL
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/purchases')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases)
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    }
  }

  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'YouTube Music Downloader Pro',
          productVersion: '1.0.0',
          price: 29.99,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        console.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Purchase error:', error)
    }
    setIsLoading(false)
  }

  const handleDownload = async (purchase: Purchase) => {
    try {
      const response = await fetch('/api/generate-download-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: purchase.id }),
      })

      if (response.ok) {
        const { token } = await response.json()
        const downloadUrl = `/api/downloads/${token}`
        window.open(downloadUrl, '_blank')
      } else {
        console.error('Failed to generate download token')
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session?.user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>

        {/* Success Message */}
        {purchaseSuccess && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              🎉 Purchase successful! Your download is now available below.
            </p>
          </div>
        )}

        {/* Purchases */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Purchases</h2>

          {purchases.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No purchases yet</CardTitle>
                <CardDescription>
                  Get started by purchasing YouTube Music Downloader Pro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">YouTube Music Downloader Pro</h3>
                    <p className="text-gray-600 mb-4">
                      Professional desktop application for downloading high-quality music from YouTube.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">$29.99</span>
                      <Button
                        onClick={handlePurchase}
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? 'Processing...' : 'Purchase Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {purchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{purchase.productName}</CardTitle>
                        <CardDescription>
                          Version {purchase.productVersion} • Purchased {formatDate(purchase.createdAt)}
                        </CardDescription>
                      </div>
                      <span className="text-lg font-semibold">
                        {formatPrice(purchase.amount, purchase.currency)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Downloads: {purchase.downloadCount} of {purchase.maxDownloads}
                        </p>
                        {purchase.expiresAt && (
                          <p className="text-sm text-gray-600">
                            Expires: {formatDate(purchase.expiresAt)}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDownload(purchase)}
                        disabled={purchase.downloadCount >= purchase.maxDownloads}
                      >
                        {purchase.downloadCount >= purchase.maxDownloads
                          ? 'Download Limit Reached'
                          : 'Download DMG'
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}