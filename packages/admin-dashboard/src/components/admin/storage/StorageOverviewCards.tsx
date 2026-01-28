'use client'

import {
  Database,
  Package,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { StorageMetrics } from '@/lib/api/types/admin'

interface StorageOverviewCardsProps {
  data: StorageMetrics | undefined
  isLoading: boolean
}

/**
 * Storage overview stat cards
 */
export function StorageOverviewCards({ data, isLoading }: StorageOverviewCardsProps) {
  if (isLoading) {
    return <StorageOverviewSkeleton />
  }

  if (!data) {
    return null
  }

  const stats = [
    {
      title: 'Total Storage',
      value: formatBytes(data.totalBytes),
      subtext: `${String(data.totalBundles)} bundles`,
      icon: Database,
      color: 'text-pastel-purple',
      bgColor: 'bg-pastel-purple/10',
    },
    {
      title: 'Total Bundles',
      value: formatNumber(data.totalBundles),
      subtext: `${String(data.byApp.length)} apps`,
      icon: Package,
      color: 'text-pastel-blue',
      bgColor: 'bg-pastel-blue/10',
    },
    {
      title: 'Avg Bundle Size',
      value: formatBytes(data.totalBundles > 0 ? data.totalBytes / data.totalBundles : 0),
      subtext: 'Per bundle',
      icon: TrendingUp,
      color: 'text-pastel-green',
      bgColor: 'bg-pastel-green/10',
    },
    {
      title: 'Orphaned Bundles',
      value: String(data.orphanedBundles),
      subtext: data.orphanedBundles > 0 ? 'Cleanup recommended' : 'All clean',
      icon: AlertTriangle,
      color: data.orphanedBundles > 0 ? 'text-pastel-orange' : 'text-pastel-green',
      bgColor: data.orphanedBundles > 0 ? 'bg-pastel-orange/10' : 'bg-pastel-green/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subtext: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

function StatCard({ title, value, subtext, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-md ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text-dark">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  )
}

function StorageOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
