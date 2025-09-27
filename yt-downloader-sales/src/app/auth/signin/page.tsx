import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignIn } from '@/components/auth/signin'

export const metadata: Metadata = {
  title: 'Sign In - YouTube Music Downloader Pro',
  description: 'Sign in to access your purchases',
}

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return <SignIn />
}