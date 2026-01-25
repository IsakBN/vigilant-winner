'use client'

/**
 * PlatformFilter Component
 *
 * Segmented control for filtering apps by platform.
 */

import { AppleIcon, AndroidIcon } from '@/components/icons'
import type { Platform } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PlatformFilterProps {
    value: Platform | 'all'
    onChange: (platform: Platform | 'all') => void
    disabled?: boolean
}

type FilterOption = {
    value: Platform | 'all'
    label: string
    Icon?: React.ComponentType<{ className?: string }>
}

const OPTIONS: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'ios', label: 'iOS', Icon: AppleIcon },
    { value: 'android', label: 'Android', Icon: AndroidIcon },
]

export function PlatformFilter({
    value,
    onChange,
    disabled,
}: PlatformFilterProps) {
    return (
        <div
            className="inline-flex rounded-lg border border-input bg-background p-1"
            role="group"
            aria-label="Filter by platform"
        >
            {OPTIONS.map((option) => {
                const isActive = value === option.value
                const { Icon } = option

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        disabled={disabled}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-accent',
                            isActive
                                ? 'bg-bright-accent text-white'
                                : 'text-text-light hover:text-text-dark hover:bg-neutral-100',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        aria-pressed={isActive}
                    >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>{option.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
