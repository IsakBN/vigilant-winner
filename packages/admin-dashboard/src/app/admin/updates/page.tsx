'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Badge,
} from '@bundlenudge/shared-ui'
import { useOtaMetrics } from '@/hooks/useAdminOps'
import {
  UpdateMetricsCards,
  TopAppsTable,
  UpdateTrendChart,
  SuccessRateCard,
  ErrorRateTrends,
} from '@/components/admin/updates'
import type { OtaMetricsPeriod } from '@/lib/api/types/admin'

/**
 * Admin OTA Updates Page
 *
 * Displays OTA update metrics, success/failure rates, top apps,
 * and update trends with auto-refresh every 30 seconds.
 */
export default function OtaUpdatesPage() {
  const [period, setPeriod] = useState<OtaMetricsPeriod>('24h')
  const { data, isLoading, isError, error, refetch, isFetching } = useOtaMetrics(period)

  const handlePeriodChange = (value: string) => {
    setPeriod(value as OtaMetricsPeriod)
  }

  const handleRefresh = () => {
    void refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-dark">OTA Updates</h1>
          <AutoRefreshIndicator isFetching={isFetching} />
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Failed to load OTA metrics</p>
          <p className="text-sm">{error?.message ?? 'An unknown error occurred'}</p>
        </div>
      )}

      {/* Metrics cards */}
      <UpdateMetricsCards data={data} isLoading={isLoading} />

      {/* Trend chart */}
      <UpdateTrendChart
        hourlyData={data?.hourlyBreakdown}
        isLoading={isLoading}
        period={period}
      />

      {/* Success rate and error trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SuccessRateCard data={data} isLoading={isLoading} />
        <ErrorRateTrends
          hourlyData={data?.hourlyBreakdown}
          appData={data?.byApp}
          isLoading={isLoading}
        />
      </div>

      {/* Top apps table */}
      <TopAppsTable apps={data?.byApp} isLoading={isLoading} />

      {/* Footer info */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Auto-refreshes every 30 seconds. Last updated:{' '}
        {data ? new Date().toLocaleTimeString() : '-'}
      </div>
    </div>
  )
}

interface AutoRefreshIndicatorProps {
  isFetching: boolean
}

function AutoRefreshIndicator({ isFetching }: AutoRefreshIndicatorProps) {
  if (isFetching) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Updating...
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-pastel-green border-pastel-green">
      Live
    </Badge>
  )
}

// Next.js App Router requires default export for pages
