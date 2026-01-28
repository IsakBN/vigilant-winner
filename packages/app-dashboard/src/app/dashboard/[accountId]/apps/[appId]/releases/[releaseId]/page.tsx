'use client'

/**
 * Release Detail Page
 *
 * View and manage a specific release including rollout controls,
 * stats, and rollback reports.
 */

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@bundlenudge/shared-ui'
import { useRelease, useUpdateRelease, type ReleaseStatus } from '@/hooks'
import { useRollbackReports } from '@/hooks/useRollbackReports'
import {
    ReleaseStats,
    ReleaseStatusBadge,
    ReleaseDetailSkeleton,
    ReleaseInfoDisplay,
    RolloutControlCard,
    RollbackReports,
} from '@/components/releases'

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
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link
                        href={`${basePath}/releases`}
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Releases
                    </Link>
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
