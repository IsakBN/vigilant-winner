'use client'

/**
 * UsageCard Component
 *
 * Individual metric card with progress bar showing usage vs limit.
 */

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@bundlenudge/shared-ui'

interface UsageCardProps {
    title: string
    value: number
    limit: number | null
    suffix?: string
    limitSuffix?: string
    limitMultiplier?: number
    format?: 'number' | 'compact'
    description: string
}

export function UsageCard({
    title,
    value,
    limit,
    suffix = '',
    limitSuffix,
    limitMultiplier = 1,
    format = 'number',
    description,
}: UsageCardProps) {
    const percentage = limit ? Math.min((value / limit) * 100, 100) : 0
    const isWarning = percentage > 75
    const isDanger = percentage > 90

    const formatValue = (val: number): string => {
        if (format === 'compact') {
            if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
            if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`
        }
        return val.toLocaleString()
    }

    const displayLimit = limit
        ? `${formatValue(limit / limitMultiplier)}${limitSuffix ?? suffix}`
        : 'Unlimited'

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{title}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatValue(value)}
                    {suffix}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                        / {displayLimit}
                    </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
                {limit && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className={`h-full transition-all ${
                                isDanger
                                    ? 'bg-destructive'
                                    : isWarning
                                      ? 'bg-yellow-500'
                                      : 'bg-primary'
                            }`}
                            style={{ width: `${String(percentage)}%` }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
