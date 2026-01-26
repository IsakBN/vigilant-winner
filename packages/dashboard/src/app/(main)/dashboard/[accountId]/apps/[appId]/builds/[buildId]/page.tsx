'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Download,
    RefreshCw,
    XCircle,
    GitBranch,
    GitCommit,
    Clock,
    FileArchive,
    Apple,
    Smartphone,
} from 'lucide-react'
import { useBuild, useBuildLogs, useRetryBuild, useCancelBuild } from '@/hooks/useBuilds'
import { BuildStatusBadge, BuildLogs } from '@/components/builds'
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Skeleton,
    Separator,
} from '@/components/ui'
import { builds } from '@/lib/api/builds'
import type { BuildPlatform, BuildArtifact } from '@/lib/api/builds'

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatDuration(startMs: number | null, endMs: number | null): string {
    if (!startMs) return '-'
    const end = endMs ?? Date.now()
    const seconds = Math.floor((end - startMs) / 1000)

    if (seconds < 60) return `${seconds} seconds`

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
}

function formatSize(bytes: number | null): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// =============================================================================
// Helper Components
// =============================================================================

function BuildDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-8 w-48" />
            </div>
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i}>
                                <Skeleton className="h-4 w-16 mb-2" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-[400px] w-full" />
        </div>
    )
}

function PlatformIcon({ platform }: { platform: BuildPlatform }) {
    if (platform === 'ios') {
        return <Apple className="w-5 h-5 text-neutral-500" />
    }
    return <Smartphone className="w-5 h-5 text-neutral-500" />
}

function InfoItem({
    label,
    value,
    icon,
}: {
    label: string
    value: React.ReactNode
    icon?: React.ReactNode
}) {
    return (
        <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                {label}
            </dt>
            <dd className="flex items-center gap-2 text-sm text-neutral-900">
                {icon}
                {value}
            </dd>
        </div>
    )
}

function ArtifactsList({
    artifacts,
    appId,
    buildId,
}: {
    artifacts: BuildArtifact[]
    appId: string
    buildId: string
}) {
    if (artifacts.length === 0) {
        return (
            <p className="text-sm text-neutral-500">No artifacts available</p>
        )
    }

    return (
        <div className="space-y-2">
            {artifacts.map((artifact) => (
                <div
                    key={artifact.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <FileArchive className="w-4 h-4 text-neutral-400" />
                        <div>
                            <p className="text-sm font-medium text-neutral-900">
                                {artifact.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                                {formatSize(artifact.size)}
                            </p>
                        </div>
                    </div>
                    <a
                        href={builds.getArtifactUrl(appId, buildId, artifact.id)}
                        download
                        className="text-primary hover:underline text-sm"
                    >
                        <Download className="w-4 h-4" />
                    </a>
                </div>
            ))}
        </div>
    )
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function BuildDetailPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string
    const buildId = params.buildId as string

    const basePath = `/dashboard/${accountId}/apps/${appId}`

    // Fetch build data
    const {
        data: build,
        isLoading,
        error,
    } = useBuild(appId, buildId, {
        refetchInterval: 3000,
    })

    // Determine if we should poll logs based on build status
    const shouldPollLogs = build?.status === 'processing' || build?.status === 'queued'

    // Fetch build logs
    const { data: logsData } = useBuildLogs(appId, buildId, {
        enabled: Boolean(build),
        refetchInterval: shouldPollLogs ? 2000 : undefined,
    })

    // Mutations
    const retryMutation = useRetryBuild(appId)
    const cancelMutation = useCancelBuild(appId)

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
                Failed to load build details
            </div>
        )
    }

    const isRunning = build.status === 'queued' || build.status === 'processing'
    const canRetry = build.status === 'failed' || build.status === 'cancelled'
    const canCancel = isRunning

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`${basePath}/builds`}
                        className="text-neutral-500 hover:text-neutral-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <PlatformIcon platform={build.platform} />
                        <h2 className="text-lg font-semibold text-neutral-900">
                            Build v{build.version}
                        </h2>
                        <BuildStatusBadge status={build.status} />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canRetry && (
                        <Button
                            variant="outline"
                            onClick={handleRetry}
                            disabled={retryMutation.isPending}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {retryMutation.isPending ? 'Retrying...' : 'Retry'}
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Build Info */}
            <Card>
                <CardContent className="p-6">
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <InfoItem label="Platform" value={build.platform.toUpperCase()} />
                        <InfoItem label="Bundle Size" value={formatSize(build.bundleSize)} />
                        <InfoItem
                            label="Duration"
                            value={formatDuration(build.startedAt, build.completedAt)}
                            icon={<Clock className="w-4 h-4 text-neutral-400" />}
                        />
                        <InfoItem label="Created" value={formatDate(build.createdAt)} />
                    </dl>

                    {(build.sourceBranch || build.sourceCommit) && (
                        <>
                            <Separator className="my-6" />
                            <dl className="grid grid-cols-2 gap-6">
                                {build.sourceBranch && (
                                    <InfoItem
                                        label="Branch"
                                        value={build.sourceBranch}
                                        icon={<GitBranch className="w-4 h-4 text-neutral-400" />}
                                    />
                                )}
                                {build.sourceCommit && (
                                    <InfoItem
                                        label="Commit"
                                        value={
                                            <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                                                {build.sourceCommit.slice(0, 8)}
                                            </code>
                                        }
                                        icon={<GitCommit className="w-4 h-4 text-neutral-400" />}
                                    />
                                )}
                            </dl>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Error Message */}
            {build.status === 'failed' && build.errorMessage && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                        <h3 className="text-sm font-semibold text-red-700">Error</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-600">{build.errorMessage}</p>
                    </CardContent>
                </Card>
            )}

            {/* Artifacts */}
            {build.artifacts && build.artifacts.length > 0 && (
                <Card>
                    <CardHeader>
                        <h3 className="text-sm font-semibold text-neutral-900">Artifacts</h3>
                    </CardHeader>
                    <CardContent>
                        <ArtifactsList
                            artifacts={build.artifacts}
                            appId={appId}
                            buildId={buildId}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Build Logs */}
            <Card>
                <CardHeader>
                    <h3 className="text-sm font-semibold text-neutral-900">Build Logs</h3>
                </CardHeader>
                <CardContent>
                    <BuildLogs
                        logs={logsData?.logs ?? []}
                        isLoading={!logsData && build.status === 'processing'}
                        hasMore={logsData?.hasMore}
                        autoScroll={isRunning}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
