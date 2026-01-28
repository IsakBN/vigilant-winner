'use client'

/**
 * UsageChart Component
 *
 * Displays usage statistics with progress bars.
 */

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'

interface UsageStats {
    monthlyActiveUsers: number
    apps: number
    storageUsedMb: number
    apiCalls: number
    bandwidthMb: number
    periodStart: number
    periodEnd: number
}

interface PlanLimits {
    monthlyActiveUsers: number | null
    apps: number | null
    storage: number | null
    apiCalls: number | null
    teamMembers: number | null
}

interface UsageChartProps {
    usage: UsageStats
    limits: PlanLimits
}

export function UsageChart({ usage, limits }: UsageChartProps) {
    const periodStart = new Date(usage.periodStart * 1000)
    const periodEnd = new Date(usage.periodEnd * 1000)

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage This Period</CardTitle>
                <CardDescription>
                    {dateFormatter.format(periodStart)} -{' '}
                    {dateFormatter.format(periodEnd)}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <UsageBar
                    label="Monthly Active Users"
                    current={usage.monthlyActiveUsers}
                    limit={limits.monthlyActiveUsers}
                />
                <UsageBar
                    label="Apps"
                    current={usage.apps}
                    limit={limits.apps}
                />
                <UsageBar
                    label="Storage"
                    current={usage.storageUsedMb}
                    limit={limits.storage ? limits.storage * 1024 : null}
                    suffix="MB"
                    limitSuffix="GB"
                    limitMultiplier={1024}
                />
                <UsageBar
                    label="API Calls"
                    current={usage.apiCalls}
                    limit={limits.apiCalls}
                    format="compact"
                />
                <UsageBar
                    label="Bandwidth"
                    current={usage.bandwidthMb}
                    limit={null}
                    suffix="MB"
                />
            </CardContent>
        </Card>
    )
}

interface UsageBarProps {
    label: string
    current: number
    limit: number | null
    suffix?: string
    limitSuffix?: string
    limitMultiplier?: number
    format?: 'number' | 'compact'
}

function UsageBar({
    label,
    current,
    limit,
    suffix = '',
    limitSuffix,
    limitMultiplier = 1,
    format = 'number',
}: UsageBarProps) {
    const percentage = limit ? Math.min((current / limit) * 100, 100) : 0
    const isWarning = percentage > 75
    const isDanger = percentage > 90

    const formatValue = (value: number): string => {
        if (format === 'compact') {
            if (value >= 1_000_000) {
                return `${(value / 1_000_000).toFixed(1)}M`
            }
            if (value >= 1_000) {
                return `${(value / 1_000).toFixed(1)}K`
            }
        }
        return value.toLocaleString()
    }

    const displayLimit = limit
        ? `${formatValue(limit / limitMultiplier)}${limitSuffix ?? suffix}`
        : 'Unlimited'

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                    {formatValue(current)}
                    {suffix} / {displayLimit}
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                    className={`h-full transition-all ${
                        isDanger
                            ? 'bg-destructive'
                            : isWarning
                              ? 'bg-yellow-500'
                              : 'bg-primary'
                    }`}
                    style={{ width: `${limit ? String(percentage) : '0'}%` }}
                />
            </div>
        </div>
    )
}
