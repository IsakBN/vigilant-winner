'use client'

import { useParams } from 'next/navigation'
import { Card, Skeleton } from '@bundlenudge/shared-ui'
import { useApps, useUsage } from '@/hooks'
import { ActivityFeed } from '@/components/dashboard'

/**
 * Stats card skeleton for loading state
 */
function StatsCardSkeleton() {
    return (
        <Card className="p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16 mt-2" />
        </Card>
    )
}

/**
 * Stats card component
 */
function StatsCard({
    label,
    value,
}: {
    label: string
    value: number | string
}) {
    return (
        <Card className="p-6">
            <div className="text-sm font-medium text-text-light">{label}</div>
            <div className="text-3xl font-semibold text-text-dark mt-1">
                {value}
            </div>
        </Card>
    )
}

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num: number): string {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`
    }
    return String(num)
}

/**
 * Account dashboard home page
 *
 * Shows an overview of the account including:
 * - Quick stats (apps, releases, devices, updates)
 * - Recent activity
 * - Getting started guide (if new)
 */
export default function AccountDashboardPage() {
    const params = useParams()
    const accountId = params.accountId as string

    const { apps, total: totalApps, isLoading: appsLoading } = useApps(accountId)
    const { data: usageData, isLoading: usageLoading } = useUsage(accountId)

    const isLoading = appsLoading || usageLoading

    // Calculate aggregated stats from apps
    const activeDevices = apps.reduce(
        (sum, app) => sum + (app.activeDevices ?? 0),
        0
    )

    // Get updates this month from usage data
    const updatesThisMonth = usageData?.usage.apiCalls ?? 0

    // Check if user has no apps yet (show getting started)
    const showGettingStarted = !appsLoading && totalApps === 0

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-semibold text-text-dark">
                    Dashboard
                </h1>
                <p className="text-text-light mt-1">
                    Welcome to your BundleNudge dashboard
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    <>
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatsCard label="Total Apps" value={totalApps} />
                        <StatsCard
                            label="Active Devices"
                            value={formatNumber(activeDevices)}
                        />
                        <StatsCard
                            label="Monthly Active Users"
                            value={formatNumber(
                                usageData?.usage.monthlyActiveUsers ?? 0
                            )}
                        />
                        <StatsCard
                            label="Updates This Month"
                            value={formatNumber(updatesThisMonth)}
                        />
                    </>
                )}
            </div>

            {/* Getting started - only show when user has no apps */}
            {showGettingStarted && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-text-dark">
                        Getting Started
                    </h2>
                    <p className="text-text-light mt-2">
                        Create your first app to start pushing OTA updates to
                        your React Native application.
                    </p>
                    <div className="mt-4">
                        <a
                            href={`/dashboard/${accountId}/apps/new`}
                            className="inline-flex items-center px-4 py-2 bg-bright-accent text-white rounded-md hover:bg-bright-accent/90 transition-colors"
                        >
                            Create App
                        </a>
                    </div>
                </Card>
            )}

            {/* Recent Activity section - show when user has apps */}
            {!showGettingStarted && (
                <ActivityFeed accountId={accountId} />
            )}
        </div>
    )
}
