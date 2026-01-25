'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

/**
 * Account-scoped dashboard layout
 *
 * Handles authentication validation and wraps children with
 * the main dashboard shell (sidebar + header).
 */
export default function AccountDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const accountId = params.accountId as string
  const { isLoading, isAuthenticated, user } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectPath = `/dashboard/${accountId}`
      router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`)
    }
  }, [isLoading, isAuthenticated, router, accountId])

  // Security: Verify accountId matches authenticated user
  // For now, we only support personal accounts (accountId === userId)
  // Teams will be handled via separate team context
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && accountId !== user.id) {
      // User is trying to access another account - redirect to their own
      router.replace(`/dashboard/${user.id}`)
    }
  }, [isLoading, isAuthenticated, user, accountId, router])

  // Show loading while session loads
  if (isLoading) {
    return <DashboardLoadingState />
  }

  // Not authenticated - show loading while redirecting
  if (!isAuthenticated) {
    return <DashboardLoadingState />
  }

  // Account mismatch - loading while redirecting
  if (user && accountId !== user.id) {
    return <DashboardLoadingState />
  }

  return (
    <DashboardLayout accountId={accountId}>
      {children}
    </DashboardLayout>
  )
}

function DashboardLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <div className="w-8 h-8 border-2 border-bright-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
