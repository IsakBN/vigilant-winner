'use client'

import { TrendingUp, Download, AlertTriangle, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ReleaseStats as ReleaseStatsType } from '@/lib/api/releases'

// =============================================================================
// Types
// =============================================================================

interface ReleaseStatsProps {
    stats: ReleaseStatsType | null
    isLoading?: boolean
}

interface StatItemProps {
    label: string
    value: string | number
    icon: React.ReactNode
    trend?: number
    variant?: 'default' | 'success' | 'warning' | 'error'
}

// =============================================================================
// Helper Components
// =============================================================================

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
}

function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
}

function StatItem({ label, value, icon, trend, variant = 'default' }: StatItemProps) {
    const iconColors = {
        default: 'text-neutral-500 bg-neutral-100',
        success: 'text-green-600 bg-green-100',
        warning: 'text-amber-600 bg-amber-100',
        error: 'text-red-600 bg-red-100',
    }

    return (
        <div className="flex items-center gap-3">
            <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', iconColors[variant])}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-neutral-900">{value}</span>
                    {trend !== undefined && (
                        <span
                            className={cn(
                                'text-xs font-medium flex items-center',
                                trend >= 0 ? 'text-green-600' : 'text-red-600'
                            )}
                        >
                            <TrendingUp
                                className={cn('w-3 h-3 mr-0.5', trend < 0 && 'rotate-180')}
                            />
                            {Math.abs(trend)}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <div>
                                <Skeleton className="h-4 w-20 mb-1" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// =============================================================================
// Main Component
// =============================================================================

export function ReleaseStats({ stats, isLoading }: ReleaseStatsProps) {
    if (isLoading) {
        return <StatsSkeleton />
    }

    const adoptionRate = stats?.adoptionRate ?? 0
    const downloads = stats?.downloads ?? 0
    const activeDevices = stats?.activeDevices ?? 0
    const errors = stats?.errors ?? 0

    const errorRate = downloads > 0 ? (errors / downloads) * 100 : 0
    const errorVariant = errorRate > 5 ? 'error' : errorRate > 1 ? 'warning' : 'default'

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <StatItem
                        label="Adoption Rate"
                        value={formatPercentage(adoptionRate)}
                        icon={<TrendingUp className="w-5 h-5" />}
                        variant={adoptionRate >= 50 ? 'success' : 'default'}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <StatItem
                        label="Total Downloads"
                        value={formatNumber(downloads)}
                        icon={<Download className="w-5 h-5" />}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <StatItem
                        label="Active Devices"
                        value={formatNumber(activeDevices)}
                        icon={<Users className="w-5 h-5" />}
                        variant="success"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <StatItem
                        label="Error Rate"
                        value={formatPercentage(errorRate)}
                        icon={<AlertTriangle className="w-5 h-5" />}
                        variant={errorVariant}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

// =============================================================================
// Compact Variant
// =============================================================================

interface ReleaseStatsCompactProps {
    stats: ReleaseStatsType | null
}

export function ReleaseStatsCompact({ stats }: ReleaseStatsCompactProps) {
    const adoptionRate = stats?.adoptionRate ?? 0
    const downloads = stats?.downloads ?? 0
    const errors = stats?.errors ?? 0
    const errorRate = downloads > 0 ? (errors / downloads) * 100 : 0

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Release Stats
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Adoption</span>
                        <span className="text-sm font-medium text-neutral-900">
                            {formatPercentage(adoptionRate)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Downloads</span>
                        <span className="text-sm font-medium text-neutral-900">
                            {formatNumber(downloads)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">Error Rate</span>
                        <span
                            className={cn(
                                'text-sm font-medium',
                                errorRate > 5 ? 'text-red-600' : errorRate > 1 ? 'text-amber-600' : 'text-green-600'
                            )}
                        >
                            {formatPercentage(errorRate)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
