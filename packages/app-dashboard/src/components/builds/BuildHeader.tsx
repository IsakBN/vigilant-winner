'use client'

/**
 * BuildHeader Component
 *
 * Header with build version, platform, status, and action buttons.
 */

import Link from 'next/link'
import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react'
import { Button, cn } from '@bundlenudge/shared-ui'
import { PlatformBadge } from '@/components/apps/PlatformBadge'
import { BuildStatusBadge } from './BuildStatusBadge'
import type { Build } from '@/lib/api/builds'

interface BuildHeaderProps {
    build: Build
    basePath: string
    onRetry: () => void
    onCancel: () => void
    isRetrying: boolean
    isCancelling: boolean
}

export function BuildHeader({
    build,
    basePath,
    onRetry,
    onCancel,
    isRetrying,
    isCancelling,
}: BuildHeaderProps) {
    const isRunning = build.status === 'queued' || build.status === 'processing'
    const canRetry = build.status === 'failed' || build.status === 'cancelled'
    const canCancel = isRunning

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link
                    href={`${basePath}/builds`}
                    className="text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <PlatformBadge platform={build.platform} showLabel={false} />
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
                        onClick={onRetry}
                        disabled={isRetrying}
                    >
                        <RefreshCw className={cn('w-4 h-4 mr-2', isRetrying && 'animate-spin')} />
                        {isRetrying ? 'Retrying...' : 'Retry'}
                    </Button>
                )}
                {canCancel && (
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </Button>
                )}
            </div>
        </div>
    )
}
