'use client'

/**
 * PlatformBadge Component
 *
 * Displays iOS or Android platform badge with icon.
 */

import { cn, Badge } from '@bundlenudge/shared-ui'
import { AppleIcon, AndroidIcon } from '@/components/icons'
import type { Platform } from '@/lib/api'

interface PlatformBadgeProps {
    platform: Platform
    className?: string
    showLabel?: boolean
}

const PLATFORM_CONFIG = {
    ios: {
        label: 'iOS',
        Icon: AppleIcon,
        className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    },
    android: {
        label: 'Android',
        Icon: AndroidIcon,
        className: 'bg-green-50 text-green-700 border-green-200',
    },
} as const

export function PlatformBadge({
    platform,
    className,
    showLabel = true,
}: PlatformBadgeProps) {
    const config = PLATFORM_CONFIG[platform]
    const { Icon } = config

    return (
        <Badge
            variant="outline"
            className={cn(
                'inline-flex items-center gap-1 font-medium',
                config.className,
                className
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            {showLabel && <span>{config.label}</span>}
        </Badge>
    )
}
