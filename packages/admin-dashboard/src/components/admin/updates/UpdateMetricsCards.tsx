'use client'

import { Download, Smartphone, CheckCircle, XCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { OtaMetrics } from '@/lib/api/types/admin'

interface UpdateMetricsCardsProps {
  data: OtaMetrics | undefined
  isLoading: boolean
}

/**
 * OTA volume metrics cards grid
 * Displays total downloads, unique devices, success/failure rates
 */
export function UpdateMetricsCards({ data, isLoading }: UpdateMetricsCardsProps) {
  if (isLoading) {
    return <MetricsCardsSkeleton />
  }

  if (!data) {
    return null
  }

  const stats = [
    {
      title: 'Total Updates',
      value: formatNumber(data.totalUpdates),
      subtext: formatBytes(data.downloadBytes),
      icon: Download,
      color: 'text-pastel-blue',
      bgColor: 'bg-pastel-blue/10',
    },
    {
      title: 'Unique Devices',
      value: formatNumber(data.uniqueDevices),
      subtext: `${data.period} period`,
      icon: Smartphone,
      color: 'text-pastel-purple',
      bgColor: 'bg-pastel-purple/10',
    },
    {
      title: 'Success Rate',
      value: `${data.successRate.toFixed(1)}%`,
      subtext: `${formatNumber(data.successfulUpdates)} successful`,
      icon: CheckCircle,
      color: data.successRate >= 95 ? 'text-pastel-green' : 'text-pastel-orange',
      bgColor: data.successRate >= 95 ? 'bg-pastel-green/10' : 'bg-pastel-orange/10',
    },
    {
      title: 'Failed Updates',
      value: formatNumber(data.failedUpdates),
      subtext: `${((data.failedUpdates / Math.max(data.totalUpdates, 1)) * 100).toFixed(1)}% failure rate`,
      icon: XCircle,
      color: data.failedUpdates > 0 ? 'text-red-500' : 'text-pastel-green',
      bgColor: data.failedUpdates > 0 ? 'bg-red-100' : 'bg-pastel-green/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <MetricCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtext: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

function MetricCard({ title, value, subtext, icon: Icon, color, bgColor }: MetricCardProps) {
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

function MetricsCardsSkeleton() {
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
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
