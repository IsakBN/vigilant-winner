'use client'

/**
 * Release Center Page
 *
 * Central hub for managing staged rollouts - percentage control, pause/resume,
 * rollback, and device targeting.
 */

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { useReleases, useUpdateRelease, type ReleaseStatus } from '@/hooks/useReleases'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
    RolloutStatusCard,
    RolloutControlsCard,
    RolloutHistoryCard,
    DeviceTargetingCard,
    type RolloutHistoryItem,
} from '@/components/releases/center'

// =============================================================================
// Types
// =============================================================================

interface DeviceTargeting {
    allowlist: string[]
    blocklist: string[]
}

// =============================================================================
// Helper Components
// =============================================================================

function StatusBadge({ status }: { status: ReleaseStatus }) {
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

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-32" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-48" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
        </div>
    )
}

// =============================================================================
// Main Component
// =============================================================================

export default function ReleaseCenterPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string
    const { toast } = useToast()

    // Get releases for this app
    const { data: releasesData, isLoading } = useReleases(appId, {
        status: 'active',
        sortBy: 'createdAt',
        sortOrder: 'desc',
    })

    const currentRelease = releasesData?.releases?.[0]
    const releaseId = currentRelease?.id ?? ''

    // Update mutation
    const updateRelease = useUpdateRelease(appId, releaseId)

    // Local state
    const [rolloutValue, setRolloutValue] = useState<number | null>(null)
    const [deviceTargeting, setDeviceTargeting] = useState<DeviceTargeting>({
        allowlist: [],
        blocklist: [],
    })

    // Mock rollout history (in real app, would come from API)
    const [rolloutHistory] = useState<RolloutHistoryItem[]>([
        { id: '1', timestamp: Date.now() - 3600000, action: 'increase', percentage: 50 },
        { id: '2', timestamp: Date.now() - 7200000, action: 'increase', percentage: 25 },
        { id: '3', timestamp: Date.now() - 86400000, action: 'resume', percentage: 10 },
        { id: '4', timestamp: Date.now() - 172800000, action: 'pause', percentage: 10, reason: 'Investigating crash reports' },
    ])

    // Derived state
    const currentRollout = rolloutValue ?? currentRelease?.rolloutPercentage ?? 0
    const releaseStatus = currentRelease?.status ?? 'draft'
    const isActive = releaseStatus === 'active' || releaseStatus === 'rolling'
    const isPaused = releaseStatus === 'paused'
    const basePath = `/dashboard/${accountId}/apps/${appId}`

    // Handlers
    const handleRolloutChange = useCallback((values: number[]) => {
        const newValue = values[0]
        if (newValue !== undefined) {
            setRolloutValue(newValue)
        }
    }, [])

    const handleRolloutCommit = useCallback(() => {
        if (rolloutValue === null || rolloutValue === currentRelease?.rolloutPercentage) return

        updateRelease.mutate(
            { rolloutPercentage: rolloutValue },
            {
                onSuccess: () => {
                    toast({ title: `Rollout updated to ${String(rolloutValue)}%`, variant: 'success' })
                },
                onError: (error) => {
                    toast({
                        title: 'Failed to update rollout',
                        description: error instanceof Error ? error.message : 'Unknown error',
                        variant: 'error',
                    })
                },
            }
        )
    }, [rolloutValue, currentRelease?.rolloutPercentage, updateRelease, toast])

    const handlePresetClick = useCallback((preset: number) => {
        setRolloutValue(preset)
        if (!releaseId) return

        updateRelease.mutate(
            { rolloutPercentage: preset },
            {
                onSuccess: () => {
                    toast({ title: `Rollout updated to ${String(preset)}%`, variant: 'success' })
                },
                onError: (error) => {
                    toast({
                        title: 'Failed to update rollout',
                        description: error instanceof Error ? error.message : 'Unknown error',
                        variant: 'error',
                    })
                },
            }
        )
    }, [releaseId, updateRelease, toast])

    const handlePauseResume = useCallback(() => {
        if (!releaseId) return

        const newStatus: ReleaseStatus = isActive ? 'paused' : 'active'

        updateRelease.mutate(
            { status: newStatus },
            {
                onSuccess: () => {
                    toast({ title: isActive ? 'Rollout paused' : 'Rollout resumed', variant: 'success' })
                },
                onError: (error) => {
                    toast({
                        title: `Failed to ${isActive ? 'pause' : 'resume'} rollout`,
                        description: error instanceof Error ? error.message : 'Unknown error',
                        variant: 'error',
                    })
                },
            }
        )
    }, [releaseId, isActive, updateRelease, toast])

    const handleRollback = useCallback((reason: string) => {
        if (!releaseId) return

        updateRelease.mutate(
            { status: 'disabled' },
            {
                onSuccess: () => {
                    toast({
                        title: 'Rollback initiated',
                        description: reason || 'Release has been disabled',
                        variant: 'success',
                    })
                },
                onError: (error) => {
                    toast({
                        title: 'Failed to rollback',
                        description: error instanceof Error ? error.message : 'Unknown error',
                        variant: 'error',
                    })
                },
            }
        )
    }, [releaseId, updateRelease, toast])

    const handleAddToAllowlist = useCallback((deviceId: string) => {
        const newList = [...deviceTargeting.allowlist, deviceId]
        setDeviceTargeting((prev) => ({ ...prev, allowlist: newList }))
        if (releaseId) updateRelease.mutate({ allowlist: newList })
    }, [deviceTargeting.allowlist, releaseId, updateRelease])

    const handleRemoveFromAllowlist = useCallback((deviceId: string) => {
        const newList = deviceTargeting.allowlist.filter((id) => id !== deviceId)
        setDeviceTargeting((prev) => ({ ...prev, allowlist: newList }))
        if (releaseId) updateRelease.mutate({ allowlist: newList })
    }, [deviceTargeting.allowlist, releaseId, updateRelease])

    const handleAddToBlocklist = useCallback((deviceId: string) => {
        const newList = [...deviceTargeting.blocklist, deviceId]
        setDeviceTargeting((prev) => ({ ...prev, blocklist: newList }))
        if (releaseId) updateRelease.mutate({ blocklist: newList })
    }, [deviceTargeting.blocklist, releaseId, updateRelease])

    const handleRemoveFromBlocklist = useCallback((deviceId: string) => {
        const newList = deviceTargeting.blocklist.filter((id) => id !== deviceId)
        setDeviceTargeting((prev) => ({ ...prev, blocklist: newList }))
        if (releaseId) updateRelease.mutate({ blocklist: newList })
    }, [deviceTargeting.blocklist, releaseId, updateRelease])

    // Loading state
    if (isLoading) return <LoadingSkeleton />

    // No active release
    if (!currentRelease) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-neutral-400" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">No Active Release</h2>
                <p className="text-neutral-500 mb-4">Create a release to start managing your rollout.</p>
                <Button asChild>
                    <Link href={`${basePath}/releases`}>View Releases</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href={basePath}
                        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </Link>
                    <h1 className="text-2xl font-bold text-neutral-900">Release Center</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Current:</span>
                    <span className="font-mono text-sm font-semibold text-neutral-900">v{currentRelease.version}</span>
                    <StatusBadge status={releaseStatus} />
                </div>
            </div>

            {/* Rollout Status + Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RolloutStatusCard percentage={currentRollout} isActive={isActive} isPaused={isPaused} />
                <RolloutControlsCard
                    percentage={currentRollout}
                    isActive={isActive}
                    isPending={updateRelease.isPending}
                    onPercentageChange={handleRolloutChange}
                    onPercentageCommit={handleRolloutCommit}
                    onPresetClick={handlePresetClick}
                    onPauseResume={handlePauseResume}
                    onRollback={handleRollback}
                />
            </div>

            {/* Rollout History */}
            <RolloutHistoryCard history={rolloutHistory} />

            {/* Device Targeting */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DeviceTargetingCard
                    type="allowlist"
                    devices={deviceTargeting.allowlist}
                    onAdd={handleAddToAllowlist}
                    onRemove={handleRemoveFromAllowlist}
                />
                <DeviceTargetingCard
                    type="blocklist"
                    devices={deviceTargeting.blocklist}
                    onAdd={handleAddToBlocklist}
                    onRemove={handleRemoveFromBlocklist}
                />
            </div>

            {/* Error display */}
            {updateRelease.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {updateRelease.error instanceof Error ? updateRelease.error.message : 'Failed to update release'}
                </div>
            )}
        </div>
    )
}
