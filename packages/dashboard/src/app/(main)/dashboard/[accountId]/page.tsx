'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { useApps } from '@/hooks/useApps'
import { WelcomeCard } from '@/components/dashboard/WelcomeCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecentApps } from '@/components/dashboard/RecentApps'
import { GettingStarted } from '@/components/dashboard/GettingStarted'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Format timestamp to relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Account Dashboard Home
 *
 * Main dashboard page showing overview of the account:
 * - Welcome message
 * - Quick stats
 * - Recent apps
 * - Getting started checklist
 */
export default function AccountDashboardPage() {
  const params = useParams()
  const accountId = params.accountId as string
  const { user, isLoading: authLoading } = useAuth()
  const { apps, total, isLoading: appsLoading } = useApps(accountId)

  const isLoading = authLoading || appsLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Calculate stats from real data
  const stats = {
    totalApps: total,
    activeDevices: apps.reduce((sum, app) => sum + (app.activeDevices ?? 0), 0),
    recentReleases: apps.filter((app) => app.lastReleaseAt).length,
  }

  // Transform apps to the format expected by RecentApps
  const recentApps = apps.slice(0, 5).map((app) => ({
    id: app.id,
    name: app.name,
    platform: app.platform,
    lastRelease: app.lastReleaseAt
      ? formatRelativeTime(app.lastReleaseAt)
      : 'No releases yet',
  }))

  // Calculate onboarding status from real data
  const hasDeployedRelease = apps.some((app) => app.lastReleaseAt != null)
  const onboardingSteps = {
    hasApp: total > 0,
    hasInstalledSdk: stats.activeDevices > 0, // Active devices implies SDK installed
    hasDeployedRelease,
  }

  const isNewUser = !onboardingSteps.hasApp

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="container-fluid py-8 space-y-8">
        <WelcomeCard
          userName={user?.name ?? user?.email ?? 'there'}
          accountType={accountId === 'personal' ? 'personal' : 'team'}
        />

        <QuickStats
          totalApps={stats.totalApps}
          activeDevices={stats.activeDevices}
          recentReleases={stats.recentReleases}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentApps apps={recentApps} accountId={accountId} />
          </div>
          <div>
            {isNewUser && (
              <GettingStarted
                accountId={accountId}
                hasApp={onboardingSteps.hasApp}
                hasInstalledSdk={onboardingSteps.hasInstalledSdk}
                hasDeployedRelease={onboardingSteps.hasDeployedRelease}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="container-fluid py-8 space-y-8">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}
