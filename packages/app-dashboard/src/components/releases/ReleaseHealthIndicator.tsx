'use client'

/**
 * ReleaseHealthIndicator Component
 *
 * Visual health status indicator for a release showing overall health,
 * error rate, and rollback rate with color-coded status.
 */

import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import { Card, CardContent, cn } from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

export type HealthStatus = 'healthy' | 'warning' | 'critical'

export interface HealthIndicatorData {
    status: HealthStatus
    label: string
    description: string
}

export interface ReleaseHealthIndicatorProps {
    health: HealthIndicatorData
    errorRate: number
    rollbackRate: number
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`
}

export function calculateHealthStatus(
    errorRate: number,
    failureRate: number
): HealthIndicatorData {
    // Critical: error rate > 5% or failure rate > 10%
    if (errorRate > 5 || failureRate > 10) {
        return {
            status: 'critical',
            label: 'Critical',
            description: 'Release has significant stability issues',
        }
    }
    // Warning: error rate > 1% or failure rate > 5%
    if (errorRate > 1 || failureRate > 5) {
        return {
            status: 'warning',
            label: 'Degraded',
            description: 'Release is experiencing some issues',
        }
    }
    // Healthy
    return {
        status: 'healthy',
        label: 'Healthy',
        description: 'Release is performing well',
    }
}

// =============================================================================
// Component
// =============================================================================

export function ReleaseHealthIndicator({
    health,
    errorRate,
    rollbackRate,
}: ReleaseHealthIndicatorProps) {
    const statusConfig = {
        healthy: {
            icon: ShieldCheck,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            iconColor: 'text-green-600',
            textColor: 'text-green-700',
        },
        warning: {
            icon: ShieldAlert,
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            iconColor: 'text-amber-600',
            textColor: 'text-amber-700',
        },
        critical: {
            icon: ShieldX,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            iconColor: 'text-red-600',
            textColor: 'text-red-700',
        },
    }

    const config = statusConfig[health.status]
    const StatusIcon = config.icon

    return (
        <Card className={cn(config.bgColor, config.borderColor, 'border')}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            'flex items-center justify-center w-12 h-12 rounded-full',
                            health.status === 'healthy' && 'bg-green-100',
                            health.status === 'warning' && 'bg-amber-100',
                            health.status === 'critical' && 'bg-red-100'
                        )}
                    >
                        <StatusIcon className={cn('w-6 h-6', config.iconColor)} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn('font-semibold', config.textColor)}>
                                Release Health: {health.label}
                            </h4>
                        </div>
                        <p className="text-sm text-neutral-600 mb-3">
                            {health.description}
                        </p>
                        <div className="flex gap-6 text-sm">
                            <div>
                                <span className="text-neutral-500">Error Rate: </span>
                                <span
                                    className={cn(
                                        'font-medium',
                                        errorRate > 5
                                            ? 'text-red-600'
                                            : errorRate > 1
                                              ? 'text-amber-600'
                                              : 'text-green-600'
                                    )}
                                >
                                    {formatPercentage(errorRate)}
                                </span>
                            </div>
                            <div>
                                <span className="text-neutral-500">Rollback Rate: </span>
                                <span
                                    className={cn(
                                        'font-medium',
                                        rollbackRate > 10
                                            ? 'text-red-600'
                                            : rollbackRate > 5
                                              ? 'text-amber-600'
                                              : 'text-green-600'
                                    )}
                                >
                                    {formatPercentage(rollbackRate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
