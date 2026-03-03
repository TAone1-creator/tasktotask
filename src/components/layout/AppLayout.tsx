'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (loading) return

    // Don't redirect more than once per state change
    if (hasRedirected.current) return

    if (!user) {
      hasRedirected.current = true
      router.replace('/auth/login')
      return
    }

    if (profile && !profile.onboarding_completed && pathname !== '/onboarding') {
      hasRedirected.current = true
      router.replace('/onboarding')
      return
    }
  }, [loading, user, profile, router, pathname])

  // Reset redirect flag only when auth state settles to a valid state
  useEffect(() => {
    if (user && profile?.onboarding_completed) {
      hasRedirected.current = false
    }
  }, [user, profile?.onboarding_completed])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar profile={profile} />
      <main className="flex-1 lg:ml-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
