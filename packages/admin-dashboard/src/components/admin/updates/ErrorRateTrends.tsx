'use client'

import { AlertTriangle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
} from '@bundlenudge/shared-ui'
import type { OtaMetricsHourlyBreakdown, OtaMetricsAppBreakdown } from '@/lib/api/types/admin'

interface ErrorRateTrendsProps {
  hourlyData: OtaMetricsHourlyBreakdown[] | undefined
  appData: OtaMetricsAppBreakdown[] | undefined
  isLoading: boolean
}

/**
 * Error rate trends and problematic apps
 */
export function ErrorRateTrends({ hourlyData, appData, isLoading }: ErrorRateTrendsProps) {
  if (isLoading) {
    return <ErrorRateTrendsSkeleton />
  }

  const hourly = hourlyData ?? []
  const apps = appData ?? []

  // Calculate error rates per hour
  const errorRates = hourly.map((h) => {
    const total = h.success + h.failed
    return total > 0 ? (h.failed / total) * 100 : 0
  })

  const avgErrorRate = errorRates.length > 0
    ? errorRates.reduce((a, b) => a + b, 0) / errorRates.length
    : 0

  const maxErrorRate = Math.max(...errorRates, 0)

  // Find apps with highest failure rates
  const problematicApps = apps
    .filter((app) => app.failures > 0)
    .map((app) => ({
      ...app,
      errorRate: app.updates > 0 ? (app.failures / app.updates) * 100 : 0,
    }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-text-dark">
          Error Rate Trends
        </CardTitle>
        <Badge
          className={
            avgErrorRate < 1
              ? 'bg-pastel-green/10 text-pastel-green'
              : avgErrorRate < 5
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }
        >
          Avg: {avgErrorRate.toFixed(2)}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mini sparkline for error rates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-light">
              <span>Error Rate Over Time</span>
              <span>Peak: {maxErrorRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-end gap-0.5 h-12">
              {errorRates.map((rate, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${
                    rate > 5 ? 'bg-red-400' : rate > 1 ? 'bg-yellow-400' : 'bg-pastel-green'
                  }`}
                  style={{ height: `${String(Math.min(100, (rate / Math.max(maxErrorRate, 1)) * 100))}%`, minHeight: rate > 0 ? '2px' : 0 }}
                />
              ))}
            </div>
          </div>

          {/* Problematic apps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-text-dark">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Apps with Failures
            </div>
            {problematicApps.length === 0 ? (
              <p className="text-sm text-text-light py-2">No failures detected</p>
            ) : (
              <div className="space-y-2">
                {problematicApps.map((app) => (
                  <div
                    key={app.appId}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="text-text-dark truncate max-w-[60%]">
                      {app.appName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-light">
                        {String(app.failures)} failed
                      </span>
                      <Badge className="bg-red-100 text-red-700">
                        {app.errorRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorRateTrendsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
