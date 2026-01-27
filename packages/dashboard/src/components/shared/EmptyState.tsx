'use client'

/**
 * EmptyState Component
 *
 * A flexible empty state component for consistent empty state handling.
 * Supports two variants:
 * - 'default': Full illustration with colored icon container, title, description, and CTA
 * - 'minimal': Compact version for tables and lists
 */

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface EmptyStateProps {
    icon?: React.ComponentType<{ className?: string }>
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    variant?: 'minimal' | 'default'
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    variant = 'default',
    className,
}: EmptyStateProps) {
    if (variant === 'minimal') {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center py-8 px-4',
                    className
                )}
            >
                {Icon && (
                    <Icon className="w-8 h-8 text-muted-foreground mb-3" />
                )}
                <p className="text-sm font-medium text-muted-foreground">
                    {title}
                </p>
                {description && (
                    <p className="text-xs text-muted-foreground/70 mt-1 text-center max-w-xs">
                        {description}
                    </p>
                )}
                {action && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={action.onClick}
                        className="mt-3"
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-16 px-4',
                className
            )}
        >
            {Icon && (
                <div className="w-20 h-20 rounded-2xl bg-soft-yellow/50 flex items-center justify-center mb-6">
                    <Icon className="w-10 h-10 text-text-dark" />
                </div>
            )}
            <h3 className="text-xl font-semibold text-text-dark mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-text-light text-center max-w-md mb-6">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick} size="lg">
                    {action.label}
                </Button>
            )}
        </div>
    )
}
