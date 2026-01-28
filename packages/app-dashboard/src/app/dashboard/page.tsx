'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

/**
 * Dashboard home page
 *
 * Redirects to the user's personal account dashboard.
 * In the future, this could show an account selector if
 * the user has multiple accounts.
 */
export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect to the user's personal account dashboard
      router.replace(`/dashboard/${user.id}`)
    }
  }, [user, isLoading, router])

  // Show loading state while checking auth
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
