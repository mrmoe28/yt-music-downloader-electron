import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Landing } from '@/components/landing'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'YouTube Music Downloader Pro - Professional Music Downloads',
  description: 'Download high-quality music from YouTube with our professional desktop application for macOS.',
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return <Landing />
}