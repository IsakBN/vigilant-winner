'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { WelcomeCard } from '@/components/dashboard/WelcomeCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecentApps } from '@/components/dashboard/RecentApps'
import { GettingStarted } from '@/components/dashboard/GettingStarted'
import { Skeleton } from '@/components/ui/skeleton'

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
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Mock data - in production, fetch from API
  const stats = {
    totalApps: 3,
    activeDevices: 1250,
    recentReleases: 12,
  }

  const apps = [
    { id: '1', name: 'My App', platform: 'ios' as const, lastRelease: '2 hours ago' },
    { id: '2', name: 'Another App', platform: 'android' as const, lastRelease: '1 day ago' },
    { id: '3', name: 'Test App', platform: 'both' as const, lastRelease: '3 days ago' },
  ]

  const onboardingSteps = {
    hasApp: apps.length > 0,
    hasInstalledSdk: true,
    hasDeployedRelease: true,
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
            <RecentApps apps={apps} accountId={accountId} />
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
