'use client'

/**
 * RollbackReports Component - Displays rollback metrics for a release.
 *
 * Shows summary stats, failure breakdown with progress bars, and recent rollbacks.
 */

import { CheckCircle, AlertTriangle, Percent } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, cn } from '@bundlenudge/shared-ui'
import type { RollbackReport } from '@/hooks/useRollbackReports'
import {
    RollbackSummaryCard,
    FailureBreakdownSection,
    RecentRollbacksSection,
    RollbackReportsSkeleton,
} from './rollback'

// =============================================================================
// Types
// =============================================================================

interface RollbackReportsProps {
    report: RollbackReport | null
    isLoading?: boolean
    error?: Error | null
    className?: string
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
}

function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
}

// =============================================================================
// Error State Component
// =============================================================================

function RollbackReportsError({ error }: { error: Error }) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="text-center py-4">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                        Unable to load rollback reports
                    </p>
                    <p className="text-xs text-neutral-500">{error.message}</p>
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Empty State Component
// =============================================================================

function RollbackReportsEmpty() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                        No rollback data available
                    </p>
                    <p className="text-xs text-neutral-500">
                        Rollback reports will appear here once devices start reporting.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Main Component
// =============================================================================

export function RollbackReports({
    report,
    isLoading,
    error,
    className,
}: RollbackReportsProps) {
    if (isLoading) {
        return <RollbackReportsSkeleton />
    }

    if (error) {
        return <RollbackReportsError error={error} />
    }

    if (!report) {
        return <RollbackReportsEmpty />
    }

    const { summary, failureBreakdown, recentRollbacks } = report
    const failureVariant = summary.failureRate > 10
        ? 'error'
        : summary.failureRate > 5
            ? 'warning'
            : 'default'

    return (
        <div className={cn('space-y-6', className)}>
            {/* Summary Section */}
            <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-3">Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <RollbackSummaryCard
                        label="Healthy"
                        value={formatNumber(summary.healthy)}
                        icon={<CheckCircle className="w-5 h-5" />}
                        variant="success"
                    />
                    <RollbackSummaryCard
                        label="Rolled Back"
                        value={formatNumber(summary.rolledBack)}
                        icon={<AlertTriangle className="w-5 h-5" />}
                        variant={summary.rolledBack > 0 ? 'warning' : 'default'}
                    />
                    <RollbackSummaryCard
                        label="Failure Rate"
                        value={formatPercentage(summary.failureRate)}
                        icon={<Percent className="w-5 h-5" />}
                        variant={failureVariant}
                    />
                </div>
            </div>

            {/* Failure Breakdown Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Failure Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <FailureBreakdownSection breakdown={failureBreakdown} />
                </CardContent>
            </Card>

            {/* Recent Rollbacks Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Rollbacks</CardTitle>
                </CardHeader>
                <CardContent>
                    <RecentRollbacksSection rollbacks={recentRollbacks} />
                </CardContent>
            </Card>
        </div>
    )
}
