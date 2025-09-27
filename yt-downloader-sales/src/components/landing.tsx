'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Landing() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      await signIn('email', { email, callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            YouTube Music Downloader Pro
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional desktop application for downloading high-quality music from YouTube.
            Built for macOS with a modern, intuitive interface.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>High Quality Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download music in the highest available quality, up to 320kbps MP3 or lossless formats.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Batch Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download entire playlists or multiple tracks simultaneously with progress tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>USB Drive Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Direct transfer to USB drives with automatic drive detection and file management.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">$29.99</CardTitle>
              <CardDescription>One-time purchase • Lifetime license</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Universal macOS binary (Intel & Apple Silicon)
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited downloads
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Automatic updates
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Email support
                </li>
              </ul>

              <form onSubmit={handleSignIn} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? 'Processing...' : 'Buy Now with Stripe'}
                </Button>
              </form>

              <p className="text-xs text-gray-500 text-center">
                Secure payment processed by Stripe. You'll receive a download link immediately after purchase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}