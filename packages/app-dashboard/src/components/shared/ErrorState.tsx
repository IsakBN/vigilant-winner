'use client'

/**
 * ErrorState Component
 *
 * A consistent error state component for displaying errors across the dashboard.
 */

import { AlertCircle } from 'lucide-react'
import { cn, Button } from '@bundlenudge/shared-ui'

interface ErrorStateProps {
    title?: string
    message: string
    onRetry?: () => void
    retryLabel?: string
    className?: string
}

export function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    retryLabel = 'Try again',
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-12 px-4',
                className
            )}
        >
            {/* Icon container */}
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-foreground mb-1">
                {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                {message}
            </p>

            {/* Retry button */}
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    {retryLabel}
                </Button>
            )}
        </div>
    )
}
