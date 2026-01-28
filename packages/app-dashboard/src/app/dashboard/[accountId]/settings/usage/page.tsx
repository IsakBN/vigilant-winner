'use client'

/**
 * Usage Page
 *
 * Displays usage statistics, MAU chart, storage, and API calls.
 */

import { useParams } from 'next/navigation'
import { useUsage, useSubscription } from '@/hooks'
import {
    UsageChart,
    UsageGrid,
    UsageSettingsSkeleton,
} from '@/components/settings'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'

export default function UsagePage() {
    const params = useParams()
    const accountId = params.accountId as string

    const { data: usageData, isLoading: usageLoading } = useUsage(accountId)
    const { data: subscriptionData, isLoading: subLoading } =
        useSubscription(accountId)

    const isLoading = usageLoading || subLoading

    if (isLoading) {
        return <UsageSettingsSkeleton />
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

            <UsageGrid usage={usage} limits={limits} />

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
    return `${String(bytes)} B`
}
