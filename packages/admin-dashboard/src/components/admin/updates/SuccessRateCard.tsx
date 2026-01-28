'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { OtaMetrics } from '@/lib/api/types/admin'

interface SuccessRateCardProps {
  data: OtaMetrics | undefined
  isLoading: boolean
}

/**
 * Success rate card with visual indicator and breakdown
 */
export function SuccessRateCard({ data, isLoading }: SuccessRateCardProps) {
  if (isLoading) {
    return <SuccessRateCardSkeleton />
  }

  if (!data) {
    return null
  }

  const { successRate, totalUpdates, successfulUpdates, failedUpdates } = data
  const healthStatus = getHealthStatus(successRate)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main rate display */}
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-text-dark">
              {successRate.toFixed(1)}%
            </div>
            <HealthIndicator status={healthStatus} />
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor(healthStatus)}`}
              style={{ width: `${String(successRate)}%` }}
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-center pt-2">
            <div>
              <div className="text-lg font-semibold text-text-dark">
                {formatNumber(totalUpdates)}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-pastel-green">
                {formatNumber(successfulUpdates)}
              </div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-500">
                {formatNumber(failedUpdates)}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type HealthStatus = 'healthy' | 'warning' | 'critical'

function getHealthStatus(rate: number): HealthStatus {
  if (rate >= 95) return 'healthy'
  if (rate >= 90) return 'warning'
  return 'critical'
}

function getProgressColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'bg-pastel-green'
    case 'warning': return 'bg-yellow-400'
    case 'critical': return 'bg-red-500'
  }
}

interface HealthIndicatorProps {
  status: HealthStatus
}

function HealthIndicator({ status }: HealthIndicatorProps) {
  const colorClass = status === 'healthy'
    ? 'bg-pastel-green'
    : status === 'warning'
    ? 'bg-yellow-400'
    : 'bg-red-500'

  const label = status === 'healthy' ? 'Healthy' : status === 'warning' ? 'Warning' : 'Critical'

  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${colorClass} animate-pulse`} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

function SuccessRateCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}
