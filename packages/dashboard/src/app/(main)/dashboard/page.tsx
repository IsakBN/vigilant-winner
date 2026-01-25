'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Dashboard Root Redirect
 *
 * Redirects /dashboard to /dashboard/personal/apps for the default account.
 * This ensures URLs contain the account context for security and clarity.
 */
export default function DashboardRedirect() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    // Redirect to personal account apps
    router.replace('/dashboard/personal/apps')
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-cream-bg">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <div className="flex justify-center gap-2 pt-4">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
    </div>
  )
}
