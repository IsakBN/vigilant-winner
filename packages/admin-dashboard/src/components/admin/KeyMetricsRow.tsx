'use client'

import {
  Download,
  Hammer,
  Activity,
  HardDrive,
  AppWindow,
  Users,
} from 'lucide-react'
import { Card, CardContent, Skeleton } from '@bundlenudge/shared-ui'
import type {
  OtaMetrics,
  BuildQueueStats,
  ApiHealthStats,
  StorageMetrics,
} from '@/lib/api/types/admin'
import type { DashboardOverview } from '@/lib/api/types'

interface KeyMetricsRowProps {
  otaMetrics: OtaMetrics | undefined
  buildQueue: BuildQueueStats | undefined
  apiHealth: ApiHealthStats | undefined
  storage: StorageMetrics | undefined
  stats: DashboardOverview | undefined
  isLoading: boolean
}

/**
 * Six key metric cards in a responsive row
 */
export function KeyMetricsRow({
  otaMetrics,
  buildQueue,
  apiHealth,
  storage,
  stats,
  isLoading,
}: KeyMetricsRowProps) {
  if (isLoading) {
    return <KeyMetricsRowSkeleton />
  }

  const metrics = [
    {
      title: 'OTA Updates',
      value: formatNumber(otaMetrics?.totalUpdates ?? 0),
      subtext: `${String(otaMetrics?.successRate?.toFixed(1) ?? 0)}% success`,
      icon: Download,
      color: 'text-pastel-blue',
    },
    {
      title: 'Build Queue',
      value: String(buildQueue?.queueDepth ?? 0),
      subtext: `${String(buildQueue?.completedToday ?? 0)} completed today`,
      icon: Hammer,
      color: 'text-pastel-purple',
    },
    {
      title: 'API Requests',
      value: formatNumber(getHourlyRate(apiHealth)),
      subtext: `${String(getAvgLatency(apiHealth))}ms avg`,
      icon: Activity,
      color: 'text-pastel-green',
    },
    {
      title: 'Storage',
      value: formatBytes(storage?.totalBytes ?? 0),
      subtext: `${String(storage?.totalBundles ?? 0)} bundles`,
      icon: HardDrive,
      color: 'text-pastel-orange',
    },
    {
      title: 'Active Apps',
      value: String(stats?.apps.active ?? 0),
      subtext: `${String(stats?.apps.total ?? 0)} total`,
      icon: AppWindow,
      color: 'text-pastel-blue',
    },
    {
      title: 'Accounts',
      value: formatNumber(stats?.users.total ?? 0),
      subtext: `${String(getPremiumCount(stats))} premium`,
      icon: Users,
      color: 'text-pastel-green',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
              <span className="text-xs text-text-light">{metric.title}</span>
            </div>
            <div className="text-xl font-bold text-text-dark">{metric.value}</div>
            <p className="text-xs text-text-light mt-1">{metric.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function KeyMetricsRowSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-3">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getHourlyRate(health: ApiHealthStats | undefined): number {
  if (!health) return 0
  return health.endpoints.reduce((sum, e) => sum + e.requestCount, 0)
}

function getAvgLatency(health: ApiHealthStats | undefined): number {
  if (!health || health.endpoints.length === 0) return 0
  const total = health.endpoints.reduce((sum, e) => sum + e.avgLatency, 0)
  return Math.round(total / health.endpoints.length)
}

function getPremiumCount(stats: DashboardOverview | undefined): number {
  if (!stats) return 0
  const byPlan = stats.subscriptions.byPlan
  return (byPlan.pro ?? 0) + (byPlan.team ?? 0) + (byPlan.enterprise ?? 0)
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
