'use client'

import { Activity, Zap, Timer } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { DatabaseStats } from '@/lib/api/types/admin'

interface QueryMetricsCardProps {
  metrics: DatabaseStats['queryMetrics'] | undefined
  isLoading: boolean
}

/**
 * Card showing query performance metrics
 */
export function QueryMetricsCard({ metrics, isLoading }: QueryMetricsCardProps) {
  if (isLoading) {
    return <QueryMetricsCardSkeleton />
  }

  if (!metrics) {
    return null
  }

  const items = [
    {
      label: 'Queries/Min',
      value: formatNumber(metrics.queriesPerMinute),
      icon: Activity,
      color: 'text-pastel-blue',
    },
    {
      label: 'Avg Time',
      value: `${String(metrics.avgQueryTime)}ms`,
      icon: Timer,
      color: 'text-pastel-green',
    },
    {
      label: 'Slow Queries',
      value: formatNumber(metrics.slowQueries),
      icon: Zap,
      color: metrics.slowQueries > 10 ? 'text-red-500' : 'text-pastel-orange',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.color}`} />
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QueryMetricsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-5 w-5 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
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

export { QueryMetricsCardSkeleton }
