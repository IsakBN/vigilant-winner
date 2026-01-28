'use client'

import { Database, HardDrive, Clock, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { DatabaseStats } from '@/lib/api/types/admin'

interface DatabaseOverviewCardsProps {
  data: DatabaseStats | undefined
  isLoading: boolean
}

/**
 * Overview cards showing key database metrics
 */
export function DatabaseOverviewCards({ data, isLoading }: DatabaseOverviewCardsProps) {
  if (isLoading) {
    return <DatabaseOverviewCardsSkeleton />
  }

  if (!data) {
    return null
  }

  const stats = [
    {
      title: 'Total Size',
      value: formatBytes(data.totalSize),
      subtext: `${String(data.tables.length)} tables`,
      icon: Database,
      color: 'text-pastel-blue',
      bgColor: 'bg-pastel-blue/10',
    },
    {
      title: 'Total Rows',
      value: formatNumber(data.tables.reduce((acc, t) => acc + t.rowCount, 0)),
      subtext: 'Across all tables',
      icon: HardDrive,
      color: 'text-pastel-green',
      bgColor: 'bg-pastel-green/10',
    },
    {
      title: 'Avg Query Time',
      value: `${String(data.queryMetrics.avgQueryTime)}ms`,
      subtext: `${formatNumber(data.queryMetrics.queriesPerMinute)} queries/min`,
      icon: Clock,
      color: 'text-pastel-purple',
      bgColor: 'bg-pastel-purple/10',
    },
    {
      title: 'Slow Queries',
      value: formatNumber(data.queryMetrics.slowQueries),
      subtext: 'Past 24 hours',
      icon: AlertTriangle,
      color: data.queryMetrics.slowQueries > 10 ? 'text-red-500' : 'text-pastel-orange',
      bgColor: data.queryMetrics.slowQueries > 10 ? 'bg-red-500/10' : 'bg-pastel-orange/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-md ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-dark">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DatabaseOverviewCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
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

export { DatabaseOverviewCardsSkeleton }
