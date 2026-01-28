'use client'

/**
 * ReleaseStatusBadge Component
 *
 * Displays release status with appropriate color styling and icons.
 * Supports: active, rolling, complete, draft, paused, disabled, failed states.
 */

import {
    CheckCircle,
    Circle,
    Loader2,
    FileText,
    Pause,
    AlertTriangle,
} from 'lucide-react'
import { Badge, cn } from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

export type ReleaseStatus =
    | 'active'
    | 'rolling'
    | 'complete'
    | 'draft'
    | 'paused'
    | 'disabled'
    | 'failed'

interface ReleaseStatusBadgeProps {
    status: ReleaseStatus
    className?: string
    showIcon?: boolean
}

// =============================================================================
// Status Configuration
// =============================================================================

interface StatusConfig {
    label: string
    className: string
    icon: React.ComponentType<{ className?: string }>
}

const STATUS_CONFIG: Record<ReleaseStatus, StatusConfig> = {
    active: {
        label: 'Active',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
    },
    rolling: {
        label: 'Rolling Out',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Loader2,
    },
    complete: {
        label: 'Complete',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
    },
    draft: {
        label: 'Draft',
        className: 'bg-neutral-50 text-neutral-600 border-neutral-200',
        icon: FileText,
    },
    paused: {
        label: 'Paused',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Pause,
    },
    disabled: {
        label: 'Disabled',
        className: 'bg-neutral-50 text-neutral-500 border-neutral-200',
        icon: Circle,
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: AlertTriangle,
    },
}

// =============================================================================
// Component
// =============================================================================

export function ReleaseStatusBadge({
    status,
    className,
    showIcon = true,
}: ReleaseStatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
    const Icon = config.icon
    const isAnimated = status === 'rolling'

    return (
        <Badge
            variant="outline"
            className={cn(
                'border text-xs font-medium gap-1.5 px-2.5 py-0.5',
                config.className,
                className
            )}
        >
            {showIcon && (
                <Icon
                    className={cn(
                        'w-3 h-3',
                        isAnimated && 'animate-spin'
                    )}
                />
            )}
            {config.label}
        </Badge>
    )
}
