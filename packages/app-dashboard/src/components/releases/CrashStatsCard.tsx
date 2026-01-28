'use client'

/**
 * CrashStatsCard Component
 *
 * Displays crash statistics for a release including total crashes,
 * crash rate percentage, and 24-hour trend indicator.
 */

import { TrendingDown, TrendingUp, Activity, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, cn } from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

export interface CrashStatsCardProps {
    totalCrashes: number
    crashRate: number
    trend: 'up' | 'down' | 'stable'
    isLoading?: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return String(num)
}

function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`
}

// =============================================================================
// Component
// =============================================================================

export function CrashStatsCard({
    totalCrashes,
    crashRate,
    trend,
    isLoading,
}: CrashStatsCardProps) {
    const getTrendIcon = () => {
        if (trend === 'up') {
            return <TrendingUp className="w-4 h-4 text-red-500" />
        }
        if (trend === 'down') {
            return <TrendingDown className="w-4 h-4 text-green-500" />
        }
        return <Activity className="w-4 h-4 text-neutral-400" />
    }

    const getTrendLabel = () => {
        if (trend === 'up') return 'Increasing'
        if (trend === 'down') return 'Decreasing'
        return 'Stable'
    }

    const crashVariant =
        crashRate > 5 ? 'error' : crashRate > 1 ? 'warning' : 'default'

    const variantStyles = {
        default: 'bg-neutral-100 text-neutral-600',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Crash Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-8 bg-neutral-100 rounded w-20" />
                        <div className="h-4 bg-neutral-100 rounded w-32" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Crash Statistics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    {/* Total Crashes */}
                    <div>
                        <p className="text-2xl font-bold text-neutral-900">
                            {formatNumber(totalCrashes)}
                        </p>
                        <p className="text-xs text-neutral-500">Total Crashes</p>
                    </div>

                    {/* Crash Rate */}
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-neutral-900">
                                {formatPercentage(crashRate)}
                            </p>
                            <span
                                className={cn(
                                    'px-1.5 py-0.5 rounded text-xs font-medium',
                                    variantStyles[crashVariant]
                                )}
                            >
                                {crashVariant === 'error'
                                    ? 'High'
                                    : crashVariant === 'warning'
                                      ? 'Moderate'
                                      : 'Low'}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500">Crash Rate</p>
                    </div>

                    {/* Trend */}
                    <div>
                        <div className="flex items-center gap-2">
                            {getTrendIcon()}
                            <p className="text-sm font-medium text-neutral-700">
                                {getTrendLabel()}
                            </p>
                        </div>
                        <p className="text-xs text-neutral-500">24h Trend</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
