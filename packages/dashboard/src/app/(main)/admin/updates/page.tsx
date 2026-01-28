'use client'

/**
 * Admin OTA Updates Page
 *
 * Monitor OTA update metrics including success rates, failures, and download stats.
 */

import { useState } from 'react'
import { useOtaMetrics } from '@/hooks/useAdminOps'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Download,
  CheckCircle,
  XCircle,
  Smartphone,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import type { OtaMetricsPeriod } from '@/lib/api'

export default function AdminUpdatesPage() {
  const [period, setPeriod] = useState<OtaMetricsPeriod>('24h')
  const { data, isLoading, error, refetch, isFetching } = useOtaMetrics(period)

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Failed to load OTA metrics. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={() => void refetch()}
        isRefreshing={isFetching}
      />

      {isLoading ? (
        <MetricsSkeleton />
      ) : data ? (
        <>
          <StatsGrid data={data} />
          <div className="grid gap-6 lg:grid-cols-2">
            <HourlyChart data={data.hourlyBreakdown} />
            <AppBreakdown data={data.byApp} />
          </div>
        </>
      ) : null}
    </div>
  )
}

interface PageHeaderProps {
  period: OtaMetricsPeriod
  onPeriodChange: (p: OtaMetricsPeriod) => void
  onRefresh: () => void
  isRefreshing: boolean
}

function PageHeader({ period, onPeriodChange, onRefresh, isRefreshing }: PageHeaderProps) {
  const periods: OtaMetricsPeriod[] = ['24h', '7d', '30d']

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">OTA Updates</h1>
        <p className="text-text-light mt-1">Monitor update delivery and success rates</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {periods.map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPeriodChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}

interface StatsGridProps {
  data: {
    totalUpdates: number
    successfulUpdates: number
    failedUpdates: number
    successRate: number
    downloadBytes: number
    uniqueDevices: number
  }
}

function StatsGrid({ data }: StatsGridProps) {
  const stats = [
    {
      label: 'Total Updates',
      value: data.totalUpdates.toLocaleString(),
      icon: TrendingUp,
      color: 'text-pastel-blue',
    },
    {
      label: 'Successful',
      value: data.successfulUpdates.toLocaleString(),
      icon: CheckCircle,
      color: 'text-pastel-green',
    },
    {
      label: 'Failed',
      value: data.failedUpdates.toLocaleString(),
      icon: XCircle,
      color: 'text-destructive',
    },
    {
      label: 'Success Rate',
      value: `${data.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: data.successRate >= 95 ? 'text-pastel-green' : 'text-pastel-yellow',
    },
    {
      label: 'Data Transferred',
      value: formatBytes(data.downloadBytes),
      icon: Download,
      color: 'text-pastel-purple',
    },
    {
      label: 'Unique Devices',
      value: data.uniqueDevices.toLocaleString(),
      icon: Smartphone,
      color: 'text-pastel-blue',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-text-dark">{stat.value}</p>
                <p className="text-sm text-text-light">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface HourlyChartProps {
  data: Array<{ hour: string; success: number; failed: number }>
}

function HourlyChart({ data }: HourlyChartProps) {
  const maxValue = Math.max(...data.map((d) => d.success + d.failed), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hourly Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-40">
          {data.slice(-24).map((entry, i) => {
            const successHeight = (entry.success / maxValue) * 100
            const failedHeight = (entry.failed / maxValue) * 100
            const title = `${entry.hour}: ${String(entry.success)} success, ${String(entry.failed)} failed`

            return (
              <div key={i} className="flex-1 flex flex-col justify-end" title={title}>
                <div className="bg-destructive/80 rounded-t" style={{ height: `${String(failedHeight)}%` }} />
                <div className="bg-pastel-green rounded-t" style={{ height: `${String(successHeight)}%` }} />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-light">
          <span>{data[0]?.hour ?? ''}</span>
          <span>{data[data.length - 1]?.hour ?? ''}</span>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-pastel-green" />
            <span className="text-text-light">Success</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/80" />
            <span className="text-text-light">Failed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface AppBreakdownProps {
  data: Array<{ appId: string; appName: string; updates: number; failures: number }>
}

function AppBreakdown({ data }: AppBreakdownProps) {
  const sortedApps = [...data].sort((a, b) => b.updates - a.updates).slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Apps by Updates</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedApps.length === 0 ? (
          <p className="text-text-light text-center py-8">No update data available</p>
        ) : (
          <div className="space-y-3">
            {sortedApps.map((app) => {
              const successRate = app.updates > 0 ? ((app.updates - app.failures) / app.updates) * 100 : 0
              const badgeClass = successRate >= 95 ? 'bg-pastel-green/20 text-pastel-green' : 'bg-pastel-yellow/20 text-pastel-yellow'

              return (
                <div key={app.appId} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-dark truncate">{app.appName}</p>
                    <p className="text-sm text-text-light">
                      {app.updates.toLocaleString()} updates
                      {app.failures > 0 && (
                        <span className="text-destructive ml-2">({app.failures} failed)</span>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className={badgeClass}>
                    {successRate.toFixed(0)}%
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MetricsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] ?? 'B'}`
}
