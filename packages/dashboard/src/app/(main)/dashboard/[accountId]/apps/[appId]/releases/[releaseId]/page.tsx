'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Loader2,
    Play,
    AlertTriangle,
    RotateCcw,
    Settings,
} from 'lucide-react'
import { useRelease, useUpdateRelease, type ReleaseStatus } from '@/hooks/useReleases'
import { useRollbackReports } from '@/hooks/useRollbackReports'
import { ReleaseStats, RollbackReports } from '@/components/releases'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface StatusBadgeProps {
    status: ReleaseStatus
}

// =============================================================================
// Helper Components
// =============================================================================

function StatusBadge({ status }: StatusBadgeProps) {
    const config: Record<ReleaseStatus, { label: string; className: string }> = {
        active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
        rolling: { label: 'Rolling', className: 'bg-blue-100 text-blue-700 border-blue-200' },
        complete: { label: 'Complete', className: 'bg-green-100 text-green-700 border-green-200' },
        draft: { label: 'Draft', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
        disabled: { label: 'Disabled', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
        paused: { label: 'Paused', className: 'bg-amber-100 text-amber-700 border-amber-200' },
        failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
    }
    const { label, className } = config[status] ?? config.draft
    return <Badge className={cn('border', className)}>{label}</Badge>
}

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

function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A'
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
    return `${bytes} B`
}

function DetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
            <Skeleton className="h-48 w-full" />
        </div>
    )
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function ReleaseDetailPage() {
    const params = useParams()
    const appId = params.appId as string
    const releaseId = params.releaseId as string
    const accountId = params.accountId as string

    // State
    const [rolloutValue, setRolloutValue] = useState<number | null>(null)

    // Hooks
    const { data: release, isLoading, error } = useRelease(appId, releaseId, {
        refetchInterval: 30000,
    })
    const updateRelease = useUpdateRelease(appId, releaseId)
    const rollbackReports = useRollbackReports(releaseId, { enabled: Boolean(release) })

    const basePath = `/dashboard/${accountId}/apps/${appId}`

    // Initialize rollout value from release
    const currentRollout = rolloutValue ?? release?.rolloutPercentage ?? 0

    // Handlers
    const handleRolloutChange = useCallback((values: number[]) => {
        setRolloutValue(values[0])
    }, [])

    const handleRolloutCommit = useCallback(async () => {
        if (rolloutValue === null || rolloutValue === release?.rolloutPercentage) return

        await updateRelease.mutateAsync({ rolloutPercentage: rolloutValue })
    }, [rolloutValue, release?.rolloutPercentage, updateRelease])

    const handleToggleStatus = useCallback(async () => {
        if (!release) return

        const newStatus: ReleaseStatus = release.status === 'active' || release.status === 'rolling'
            ? 'paused'
            : 'active'

        await updateRelease.mutateAsync({ status: newStatus })
    }, [release, updateRelease])

    const handleDisable = useCallback(async () => {
        await updateRelease.mutateAsync({ status: 'disabled' })
    }, [updateRelease])

    const handleChannelChange = useCallback(async (channel: string) => {
        await updateRelease.mutateAsync({ channel })
    }, [updateRelease])

    if (isLoading) {
        return <DetailSkeleton />
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Failed to load release: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        )
    }

    if (!release) {
        return (
            <div className="text-neutral-500">Release not found</div>
        )
    }

    const isActive = release.status === 'active' || release.status === 'rolling'
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
                        <StatusBadge status={release.status} />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Created {formatDate(release.createdAt)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`${basePath}/releases/${releaseId}/settings`}>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <ReleaseStats stats={release.stats} />

            {/* Release Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Release Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <dt className="text-sm text-neutral-500">Channel</dt>
                            <dd className="text-sm font-medium text-neutral-900 capitalize">
                                {release.channel}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-neutral-500">Bundle Size</dt>
                            <dd className="text-sm font-medium text-neutral-900">
                                {formatFileSize(release.bundleSize)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-neutral-500">Min App Version</dt>
                            <dd className="text-sm font-medium text-neutral-900">
                                {release.minAppVersion || 'Any'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-neutral-500">Max App Version</dt>
                            <dd className="text-sm font-medium text-neutral-900">
                                {release.maxAppVersion || 'Any'}
                            </dd>
                        </div>
                    </dl>
                    {release.description && (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                            <dt className="text-sm text-neutral-500 mb-1">Description</dt>
                            <dd className="text-sm text-neutral-700">{release.description}</dd>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rollout Control */}
            {canControl && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rollout Control</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Rollout Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Rollout Percentage</Label>
                                <span className="text-lg font-semibold text-neutral-900">
                                    {currentRollout}%
                                </span>
                            </div>
                            <Slider
                                value={[currentRollout]}
                                onValueChange={handleRolloutChange}
                                onValueCommit={handleRolloutCommit}
                                min={0}
                                max={100}
                                step={5}
                                disabled={updateRelease.isPending}
                            />
                            {updateRelease.isPending && (
                                <p className="text-sm text-neutral-500 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </p>
                            )}
                        </div>

                        {/* Channel Selection */}
                        <div className="space-y-2">
                            <Label>Channel</Label>
                            <Select
                                value={release.channel}
                                onValueChange={handleChannelChange}
                                disabled={updateRelease.isPending}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="production">Production</SelectItem>
                                    <SelectItem value="staging">Staging</SelectItem>
                                    <SelectItem value="development">Development</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Toggle & Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={handleToggleStatus}
                                    disabled={updateRelease.isPending}
                                />
                                <Label className="cursor-pointer" onClick={handleToggleStatus}>
                                    {isActive ? 'Active' : 'Paused'}
                                </Label>
                                {!isActive && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleToggleStatus}
                                        disabled={updateRelease.isPending}
                                    >
                                        <Play className="w-4 h-4 mr-1" />
                                        Resume
                                    </Button>
                                )}
                            </div>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <RotateCcw className="w-4 h-4 mr-1.5" />
                                        Disable Release
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            Disable Release?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will stop all devices from receiving this release.
                                            You can re-enable it later if needed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDisable}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Disable Release
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rollback Reports */}
            <RollbackReports
                report={rollbackReports.data ?? null}
                isLoading={rollbackReports.isLoading}
                error={rollbackReports.error instanceof Error ? rollbackReports.error : null}
            />

            {/* Error display */}
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
