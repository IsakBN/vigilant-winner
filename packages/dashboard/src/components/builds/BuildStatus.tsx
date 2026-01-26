'use client'

/**
 * BuildStatus Component
 *
 * Displays build status with appropriate color and icon.
 */

import {
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Ban,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { BuildStatus as BuildStatusType } from '@/lib/api/builds'

// =============================================================================
// Types
// =============================================================================

interface BuildStatusProps {
    status: BuildStatusType
    className?: string
    showIcon?: boolean
    size?: 'sm' | 'md'
}

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<
    BuildStatusType,
    { label: string; icon: typeof CheckCircle; className: string }
> = {
    queued: {
        label: 'Queued',
        icon: Clock,
        className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    },
    processing: {
        label: 'Processing',
        icon: Loader2,
        className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    completed: {
        label: 'Completed',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    failed: {
        label: 'Failed',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200',
    },
    cancelled: {
        label: 'Cancelled',
        icon: Ban,
        className: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    },
}

// =============================================================================
// Component
// =============================================================================

export function BuildStatusBadge({
    status,
    className,
    showIcon = true,
    size = 'md',
}: BuildStatusProps) {
    const config = STATUS_CONFIG[status]
    const Icon = config.icon

    const isProcessing = status === 'processing'

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-medium',
                config.className,
                size === 'sm' && 'text-xs px-1.5 py-0',
                className
            )}
        >
            {showIcon && (
                <Icon
                    className={cn(
                        'mr-1',
                        size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5',
                        isProcessing && 'animate-spin'
                    )}
                />
            )}
            {config.label}
        </Badge>
    )
}

// =============================================================================
// Status Dot (minimal indicator)
// =============================================================================

interface BuildStatusDotProps {
    status: BuildStatusType
    className?: string
}

const DOT_COLORS: Record<BuildStatusType, string> = {
    queued: 'bg-neutral-400',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    cancelled: 'bg-neutral-400',
}

export function BuildStatusDot({ status, className }: BuildStatusDotProps) {
    const isProcessing = status === 'processing'

    return (
        <span
            className={cn(
                'inline-block w-2 h-2 rounded-full',
                DOT_COLORS[status],
                isProcessing && 'animate-pulse',
                className
            )}
            title={STATUS_CONFIG[status].label}
        />
    )
}
