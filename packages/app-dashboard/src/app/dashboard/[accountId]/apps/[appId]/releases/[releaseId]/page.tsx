'use client'

/**
 * Release Detail Page
 *
 * View and manage a specific release including rollout controls,
 * stats, crash data, health indicators, and rollback reports.
 */

import { useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@bundlenudge/shared-ui'
import { useRelease, useUpdateRelease, useAppDetails, type ReleaseStatus } from '@/hooks'
import { useRollbackReports } from '@/hooks/useRollbackReports'
import {
    ReleaseStats,
    ReleaseStatusBadge,
    ReleaseDetailSkeleton,
    ReleaseInfoDisplay,
    RolloutControlCard,
    RollbackReports,
    CrashStatsCard,
    ReleaseHealthIndicator,
    calculateHealthStatus,
} from '@/components/releases'
import { Breadcrumbs } from '@/components/shared'

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function ReleaseDetailPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const appId = params.appId as string
    const releaseId = params.releaseId as string

    // Data fetching
    const { data: app } = useAppDetails(accountId, appId)
    const { data: release, isLoading, error } = useRelease(
        accountId,
        appId,
        releaseId,
        { refetchInterval: 30000 }
    )

    const updateRelease = useUpdateRelease(accountId, appId)

    const rollbackReports = useRollbackReports(
        accountId,
        appId,
        releaseId,
        { enabled: Boolean(release) }
    )

    const basePath = `/dashboard/${accountId}/apps/${appId}`

    // Handlers
    const handleRolloutChange = useCallback(async (percentage: number) => {
        await updateRelease.mutateAsync({
            releaseId,
            data: { rolloutPercentage: percentage },
        })
    }, [updateRelease, releaseId])

    const handleChannelChange = useCallback(async (channel: string) => {
        await updateRelease.mutateAsync({
            releaseId,
            data: { channel },
        })
    }, [updateRelease, releaseId])

    const handleToggleStatus = useCallback(async () => {
        if (!release) return

        const newStatus: ReleaseStatus =
            release.status === 'active' || release.status === 'rolling'
                ? 'paused'
                : 'active'

        await updateRelease.mutateAsync({
            releaseId,
            data: { status: newStatus },
        })
    }, [release, updateRelease, releaseId])

    const handleDisable = useCallback(async () => {
        await updateRelease.mutateAsync({
            releaseId,
            data: { status: 'disabled' },
        })
    }, [updateRelease, releaseId])

    // Compute crash and health metrics
    const crashMetrics = useMemo(() => {
        const stats = release?.stats
        const rollbackData = rollbackReports.data

        // Calculate error rate from stats
        const downloads = stats?.downloads ?? 0
        const errors = stats?.errors ?? 0
        const errorRate = downloads > 0 ? (errors / downloads) * 100 : 0

        // Calculate rollback/failure rate
        const failureRate = rollbackData?.summary?.failureRate ?? 0

        // Determine crash trend (simplified - could be enhanced with historical data)
        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (failureRate > 5) trend = 'up'
        else if (failureRate < 1 && errorRate < 1) trend = 'down'

        // Calculate health status
        const health = calculateHealthStatus(errorRate, failureRate)

        return {
            totalCrashes: errors,
            crashRate: errorRate,
            trend,
            health,
            errorRate,
            rollbackRate: failureRate,
        }
    }, [release?.stats, rollbackReports.data])

    // Loading state
    if (isLoading) {
        return <ReleaseDetailSkeleton />
    }

    // Error state
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Failed to load release:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        )
    }

    // Not found state
    if (!release) {
        return <div className="text-neutral-500">Release not found</div>
    }

    const canControl = release.status !== 'disabled' && release.status !== 'failed'

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <Breadcrumbs
                items={[
                    { label: 'Apps', href: `/dashboard/${accountId}/apps` },
                    { label: app?.app.name ?? 'App', href: basePath },
                    { label: 'Releases', href: `${basePath}/releases` },
                    { label: `v${release.version}` },
                ]}
            />

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-neutral-900 font-mono">
                            v{release.version}
                        </h1>
                        <ReleaseStatusBadge status={release.status} />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Created {formatDate(release.createdAt)}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`${basePath}/releases/${releaseId}/settings`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <ReleaseStats stats={release.stats} />

            {/* Health Indicator */}
            <ReleaseHealthIndicator
                health={crashMetrics.health}
                errorRate={crashMetrics.errorRate}
                rollbackRate={crashMetrics.rollbackRate}
            />

            {/* Crash Statistics */}
            <CrashStatsCard
                totalCrashes={crashMetrics.totalCrashes}
                crashRate={crashMetrics.crashRate}
                trend={crashMetrics.trend}
                isLoading={rollbackReports.isLoading}
            />

            {/* Release Info */}
            <ReleaseInfoDisplay
                channel={release.channel}
                bundleSize={release.bundleSize}
                minAppVersion={release.minAppVersion}
                maxAppVersion={release.maxAppVersion}
                description={release.description}
            />

            {/* Rollout Control */}
            {canControl && (
                <RolloutControlCard
                    releaseId={releaseId}
                    channel={release.channel}
                    rolloutPercentage={release.rolloutPercentage}
                    status={release.status}
                    isPending={updateRelease.isPending}
                    onRolloutChange={handleRolloutChange}
                    onChannelChange={handleChannelChange}
                    onToggleStatus={handleToggleStatus}
                    onDisable={handleDisable}
                />
            )}

            {/* Rollback Reports */}
            <RollbackReports
                report={rollbackReports.data ?? null}
                isLoading={rollbackReports.isLoading}
                error={rollbackReports.error instanceof Error ? rollbackReports.error : null}
            />

            {/* Update Error */}
            {updateRelease.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {updateRelease.error instanceof Error
                        ? updateRelease.error.message
                        : 'Failed to update release'}
                </div>
            )}
        </div>
    )
}
