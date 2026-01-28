'use client'

/**
 * Build Detail Page
 *
 * Displays detailed information about a single build including
 * status, logs, artifacts, and actions (retry/cancel).
 */

import { useParams } from 'next/navigation'
import { useBuild, useBuildLogs, useRetryBuild, useCancelBuild } from '@/hooks/useBuilds'
import {
    BuildHeader,
    BuildInfoCard,
    BuildTimeline,
    BuildLogs,
    BuildArtifacts,
    BuildErrorCard,
    BuildDetailSkeleton,
} from '@/components/builds'
import { Card, CardContent, CardHeader } from '@bundlenudge/shared-ui'

// =============================================================================
// Main Page Component
// =============================================================================

export default function BuildDetailPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string
    const buildId = params.buildId as string

    const basePath = `/dashboard/${accountId}/apps/${appId}`

    // Fetch build data with polling for active builds
    const {
        data: build,
        isLoading,
        error,
    } = useBuild(accountId, appId, buildId, {
        refetchInterval: 3000,
    })

    // Determine if we should poll logs based on build status
    const isRunning = build?.status === 'processing' || build?.status === 'queued'

    // Fetch build logs
    const { data: logsData } = useBuildLogs(accountId, appId, buildId, {
        enabled: Boolean(build),
        refetchInterval: isRunning ? 2000 : undefined,
    })

    // Mutations
    const retryMutation = useRetryBuild(accountId, appId)
    const cancelMutation = useCancelBuild(accountId, appId)

    const handleRetry = () => {
        retryMutation.mutate(buildId)
    }

    const handleCancel = () => {
        cancelMutation.mutate(buildId)
    }

    if (isLoading) {
        return <BuildDetailSkeleton />
    }

    if (error || !build) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Failed to load build details:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <BuildHeader
                build={build}
                basePath={basePath}
                onRetry={handleRetry}
                onCancel={handleCancel}
                isRetrying={retryMutation.isPending}
                isCancelling={cancelMutation.isPending}
            />

            {/* Timeline */}
            <BuildTimeline status={build.status} />

            {/* Build Info */}
            <BuildInfoCard build={build} />

            {/* Error Message */}
            {build.status === 'failed' && build.errorMessage && (
                <BuildErrorCard errorMessage={build.errorMessage} />
            )}

            {/* Artifacts */}
            {build.artifacts && build.artifacts.length > 0 && (
                <BuildArtifacts
                    artifacts={build.artifacts}
                    accountId={accountId}
                    appId={appId}
                    buildId={buildId}
                />
            )}

            {/* Build Logs */}
            <Card>
                <CardHeader className="pb-3">
                    <h3 className="text-sm font-semibold text-neutral-900">Build Logs</h3>
                </CardHeader>
                <CardContent className="p-0">
                    <BuildLogs
                        logs={logsData?.logs ?? []}
                        isLoading={!logsData && isRunning}
                        hasMore={logsData?.hasMore}
                        autoScroll={isRunning}
                        className="rounded-none rounded-b-lg"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
