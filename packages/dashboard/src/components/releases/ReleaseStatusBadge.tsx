'use client'

/**
 * ReleaseStatusBadge Component
 *
 * Displays release status with appropriate color and icon.
 * Supports: active, draft, disabled states.
 */

import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export type ReleaseStatus = 'active' | 'draft' | 'disabled'

interface ReleaseStatusBadgeProps {
    status: ReleaseStatus
    className?: string
    showIcon?: boolean
}

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<
    ReleaseStatus,
    { label: string; icon: typeof CheckCircle; className: string }
> = {
    active: {
        label: 'Active',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    draft: {
        label: 'Draft',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    disabled: {
        label: 'Disabled',
        icon: XCircle,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
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
    const config = STATUS_CONFIG[status]
    const Icon = config.icon

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-medium',
                config.className,
                className
            )}
        >
            {showIcon && <Icon className="w-3.5 h-3.5 mr-1" />}
            {config.label}
        </Badge>
    )
}
