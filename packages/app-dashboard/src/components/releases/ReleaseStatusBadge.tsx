'use client'

/**
 * ReleaseStatusBadge Component
 *
 * Displays release status with appropriate color styling.
 * Supports: active, rolling, complete, draft, paused, disabled, failed states.
 */

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
}

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<ReleaseStatus, { label: string; className: string }> = {
    active: {
        label: 'Active',
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    rolling: {
        label: 'Rolling',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    complete: {
        label: 'Complete',
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    draft: {
        label: 'Draft',
        className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    },
    paused: {
        label: 'Paused',
        className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    disabled: {
        label: 'Disabled',
        className: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-700 border-red-200',
    },
}

// =============================================================================
// Component
// =============================================================================

export function ReleaseStatusBadge({ status, className }: ReleaseStatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft

    return (
        <Badge
            variant="outline"
            className={cn('border text-xs', config.className, className)}
        >
            {config.label}
        </Badge>
    )
}
