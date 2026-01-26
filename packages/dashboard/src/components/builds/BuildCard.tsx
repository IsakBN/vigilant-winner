'use client'

/**
 * BuildCard Component
 *
 * Displays build summary with status, version, and timestamps.
 */

import Link from 'next/link'
import { Clock, GitBranch, GitCommit, Apple, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui'
import { BuildStatusBadge } from './BuildStatus'
import type { Build, BuildPlatform } from '@/lib/api/builds'

// =============================================================================
// Types
// =============================================================================

interface BuildCardProps {
    build: Build
    accountId: string
    appId: string
    className?: string
}

// =============================================================================
// Helpers
// =============================================================================

function formatDuration(startMs: number, endMs: number | null): string {
    const end = endMs ?? Date.now()
    const seconds = Math.floor((end - startMs) / 1000)

    if (seconds < 60) {
        return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes < 60) {
        return `${minutes}m ${remainingSeconds}s`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
}

function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    if (seconds > 10) return `${seconds}s ago`
    return 'just now'
}

function truncateCommit(commit: string | null): string {
    if (!commit) return ''
    return commit.slice(0, 7)
}

// =============================================================================
// Platform Icon
// =============================================================================

function PlatformIcon({ platform }: { platform: BuildPlatform }) {
    if (platform === 'ios') {
        return <Apple className="w-4 h-4 text-neutral-500" />
    }
    return <Smartphone className="w-4 h-4 text-neutral-500" />
}

// =============================================================================
// Component
// =============================================================================

export function BuildCard({
    build,
    accountId,
    appId,
    className,
}: BuildCardProps) {
    const buildPath = `/dashboard/${accountId}/apps/${appId}/builds/${build.id}`
    const isRunning = build.status === 'queued' || build.status === 'processing'

    return (
        <Card className={cn('hover:border-neutral-300 transition-colors', className)}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    {/* Left: Build info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <PlatformIcon platform={build.platform} />
                            <Link
                                href={buildPath}
                                className="font-mono text-sm font-medium text-neutral-900 hover:text-primary hover:underline"
                            >
                                v{build.version}
                            </Link>
                            <BuildStatusBadge status={build.status} size="sm" />
                        </div>

                        {/* Source info */}
                        <div className="flex items-center gap-4 text-xs text-neutral-500 mb-2">
                            {build.sourceBranch && (
                                <span className="flex items-center gap-1">
                                    <GitBranch className="w-3 h-3" />
                                    {build.sourceBranch}
                                </span>
                            )}
                            {build.sourceCommit && (
                                <span className="flex items-center gap-1 font-mono">
                                    <GitCommit className="w-3 h-3" />
                                    {truncateCommit(build.sourceCommit)}
                                </span>
                            )}
                        </div>

                        {/* Timestamps */}
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(build.createdAt)}
                            </span>
                            {build.startedAt && (
                                <span>
                                    Duration:{' '}
                                    {formatDuration(build.startedAt, build.completedAt)}
                                </span>
                            )}
                        </div>

                        {/* Error message */}
                        {build.status === 'failed' && build.errorMessage && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-100 text-sm text-red-700 rounded">
                                {build.errorMessage}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions indicator */}
                    <div className="flex-shrink-0">
                        {isRunning && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Compact variant for lists
// =============================================================================

interface BuildCardCompactProps {
    build: Build
    accountId: string
    appId: string
    className?: string
}

export function BuildCardCompact({
    build,
    accountId,
    appId,
    className,
}: BuildCardCompactProps) {
    const buildPath = `/dashboard/${accountId}/apps/${appId}/builds/${build.id}`

    return (
        <Link
            href={buildPath}
            className={cn(
                'flex items-center gap-4 p-3 bg-white border border-neutral-200',
                'hover:border-neutral-300 transition-colors',
                className
            )}
        >
            <PlatformIcon platform={build.platform} />
            <span className="font-mono text-sm font-medium flex-shrink-0">
                v{build.version}
            </span>
            <BuildStatusBadge status={build.status} size="sm" showIcon={false} />
            <span className="text-xs text-neutral-500 ml-auto">
                {formatRelativeTime(build.createdAt)}
            </span>
        </Link>
    )
}
