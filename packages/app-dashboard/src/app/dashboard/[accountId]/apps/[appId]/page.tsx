'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    Settings,
    Activity,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock,
    TrendingUp,
    Smartphone,
} from 'lucide-react'
import { useAppDetails } from '@/hooks/useApp'
import { useAppHealth } from '@/hooks/useAppHealth'
import { useAppMetrics } from '@/hooks/useAppMetrics'
import { PlatformBadge } from '@/components/apps'
import { SimpleBarChart, TrendLine, TrendLineSkeleton } from '@/components/charts'
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Skeleton,
    cn,
} from '@bundlenudge/shared-ui'
import { ErrorState } from '@/components/shared/ErrorState'

// ============================================================================
// Health Score Helpers
// ============================================================================

function getHealthScoreColor(score: number): string {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
}

function getHealthScoreIcon(score: number) {
    if (score >= 90) return CheckCircle
    if (score >= 70) return AlertTriangle
    return XCircle
}

function formatUpdateTime(ms: number): string {
    if (ms < 1000) return `${String(Math.round(ms))}ms`
    return `${(ms / 1000).toFixed(1)}s`
}

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
}

// ============================================================================
// Health Section Component
// ============================================================================

interface HealthSectionProps {
    accountId: string
    appId: string
}

function HealthSection({ accountId, appId }: HealthSectionProps) {
    const { data, isLoading, isError } = useAppHealth(accountId, appId)

    if (isLoading) {
        return (
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Health Monitoring
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isError || !data?.health) {
        return (
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Health Monitoring
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-sm">
                        Health data is currently unavailable. Check back later.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const health = data.health
    const ScoreIcon = getHealthScoreIcon(health.overallScore)

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Health Monitoring
                    <span className="text-sm font-normal text-gray-500 ml-auto">
                        Last 24 hours
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Overall Health Score */}
                    <div className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                    getHealthScoreColor(health.overallScore)
                                )}
                            >
                                <ScoreIcon className="w-3 h-3" />
                                {String(health.overallScore)}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">Health Score</p>
                    </div>

                    {/* Crash-Free Rate */}
                    <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-2xl font-bold text-gray-900">
                            {health.crashFreeRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">Crash-Free Rate</p>
                    </div>

                    {/* Update Success Rate */}
                    <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-2xl font-bold text-gray-900">
                            {health.updateSuccessRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">Update Success</p>
                    </div>

                    {/* Average Update Time */}
                    <div className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <p className="text-2xl font-bold text-gray-900">
                                {formatUpdateTime(health.avgUpdateTime)}
                            </p>
                        </div>
                        <p className="text-sm text-gray-600">Avg Update Time</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================================================
// Analytics Charts Section Component
// ============================================================================

interface AnalyticsSectionProps {
    accountId: string
    appId: string
}

function AnalyticsSection({ accountId, appId }: AnalyticsSectionProps) {
    const { data: metrics, isLoading: metricsLoading } = useAppMetrics(
        accountId,
        appId,
        '7d'
    )

    // Transform metrics data for charts
    const trendData =
        metrics?.trends.map((t) => ({
            label: formatDateLabel(t.date),
            value: t.updates,
            secondaryValue: t.failures,
        })) ?? []

    const distributionData =
        metrics?.deviceDistribution.map((d) => ({
            label: d.osVersion,
            value: d.count,
            percentage: d.percentage,
        })) ?? []

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Update Activity Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        <CardTitle>Update Activity</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Updates and failures over the last 7 days
                    </p>
                </CardHeader>
                <CardContent>
                    {metricsLoading ? (
                        <TrendLineSkeleton height={120} />
                    ) : (
                        <>
                            <TrendLine
                                data={trendData}
                                height={120}
                                primaryColor="bg-primary"
                                secondaryColor="bg-red-400"
                            />
                            {trendData.length > 0 && (
                                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-sm bg-primary" />
                                        <span>Updates</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-sm bg-red-400" />
                                        <span>Failures</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Device Distribution Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                        <CardTitle>Device Distribution</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        OS version breakdown of active devices
                    </p>
                </CardHeader>
                <CardContent>
                    {metricsLoading ? (
                        <DeviceDistributionSkeleton />
                    ) : (
                        <SimpleBarChart
                            data={distributionData}
                            color="blue"
                            showValues
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function DeviceDistributionSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AppDetailPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const appId = params.appId as string

    const { data, isLoading, isError, error, refetch } = useAppDetails(accountId, appId)

    if (isLoading) {
        return <AppOverviewSkeleton />
    }

    if (isError) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error?.message ?? 'Failed to load app'}
                    onRetry={() => void refetch()}
                />
            </div>
        )
    }

    const app = data?.app

    if (!app) {
        return (
            <div className="p-6">
                <ErrorState message="App not found" />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold">{app.name}</h1>
                        <PlatformBadge platform={app.platform} />
                    </div>
                    {app.bundleId && (
                        <p className="text-gray-600 font-mono text-sm">{app.bundleId}</p>
                    )}
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/${accountId}/apps/${appId}/settings`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Active Devices
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {app.stats?.activeDevices ?? 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Releases
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {app.stats?.totalReleases ?? 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Downloads This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {app.stats?.downloadsThisMonth ?? 0}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Health Monitoring */}
            <HealthSection accountId={accountId} appId={appId} />

            {/* Analytics Charts */}
            <AnalyticsSection accountId={accountId} appId={appId} />

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/${accountId}/apps/${appId}/releases/new`}>
                                Create Release
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/${accountId}/apps/${appId}/channels`}>
                                Manage Channels
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/${accountId}/apps/${appId}/devices`}>
                                View Devices
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================================================
// Skeleton Components
// ============================================================================

function AppOverviewSkeleton() {
    return (
        <div className="p-6">
            <div className="mb-6">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            {/* Health Section Skeleton */}
            <Skeleton className="h-40 mb-8" />
            {/* Analytics Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-32" />
        </div>
    )
}
