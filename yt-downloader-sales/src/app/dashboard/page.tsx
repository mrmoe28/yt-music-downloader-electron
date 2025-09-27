import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard - YouTube Music Downloader Pro',
  description: 'Access your purchases and downloads',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return <Dashboard />
}