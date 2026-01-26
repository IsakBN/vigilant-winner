'use client'

/**
 * Usage Page
 *
 * Displays usage statistics, MAU chart, storage, and API calls.
 */

import { useParams } from 'next/navigation'
import { useUsage, useSubscription } from '@/hooks/useBilling'
import { UsageChart } from '@/components/settings'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export default function UsagePage() {
    const params = useParams()
    const accountId = params.accountId as string

    const { data: usageData, isLoading: usageLoading } = useUsage(accountId)
    const { data: subscriptionData, isLoading: subLoading } =
        useSubscription(accountId)

    const isLoading = usageLoading || subLoading

    if (isLoading) {
        return <UsageSkeleton />
    }

    const usage = usageData?.usage
    const limits = usageData?.limits ?? subscriptionData?.plan?.limits

    if (!usage || !limits) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                Unable to load usage data
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <UsageChart usage={usage} limits={limits} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Monthly Active Users"
                    value={usage.monthlyActiveUsers}
                    limit={limits.monthlyActiveUsers}
                    description="Unique devices this month"
                />
                <StatCard
                    title="Apps"
                    value={usage.apps}
                    limit={limits.apps}
                    description="Active applications"
                />
                <StatCard
                    title="Storage Used"
                    value={usage.storageUsedMb}
                    limit={limits.storage ? limits.storage * 1024 : null}
                    suffix="MB"
                    limitSuffix="GB"
                    limitMultiplier={1024}
                    description="Bundle storage"
                />
                <StatCard
                    title="API Calls"
                    value={usage.apiCalls}
                    limit={limits.apiCalls}
                    format="compact"
                    description="This billing period"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bandwidth Usage</CardTitle>
                    <CardDescription>
                        Total data transferred this period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">
                        {formatBytes(usage.bandwidthMb * 1024 * 1024)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Updates delivered to devices
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Billing Period</CardTitle>
                    <CardDescription>
                        Current usage measurement period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Start
                            </p>
                            <p className="font-medium">
                                {formatDate(usage.periodStart)}
                            </p>
                        </div>
                        <div className="h-px flex-1 bg-border" />
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">End</p>
                            <p className="font-medium">
                                {formatDate(usage.periodEnd)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

interface StatCardProps {
    title: string
    value: number
    limit: number | null
    suffix?: string
    limitSuffix?: string
    limitMultiplier?: number
    format?: 'number' | 'compact'
    description: string
}

function StatCard({
    title,
    value,
    limit,
    suffix = '',
    limitSuffix,
    limitMultiplier = 1,
    format = 'number',
    description,
}: StatCardProps) {
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
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function UsageSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatBytes(bytes: number): string {
    if (bytes >= 1_000_000_000) {
        return `${(bytes / 1_000_000_000).toFixed(2)} GB`
    }
    if (bytes >= 1_000_000) {
        return `${(bytes / 1_000_000).toFixed(2)} MB`
    }
    if (bytes >= 1_000) {
        return `${(bytes / 1_000).toFixed(2)} KB`
    }
    return `${bytes} B`
}
