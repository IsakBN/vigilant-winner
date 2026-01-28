'use client'

import {
  Users,
  AppWindow,
  Smartphone,
  Rocket,
  TrendingUp,
  DollarSign,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'

export interface DashboardOverview {
  users: {
    total: number
    active: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
  }
  apps: {
    total: number
    active: number
    newThisWeek: number
  }
  devices: {
    total: number
    active: number
    byPlatform: {
      ios: number
      android: number
    }
  }
  releases: {
    total: number
    thisWeek: number
    avgBundleSize: number
  }
  subscriptions: {
    active: number
    mrr: number
    churnRate: number
  }
}

interface StatsGridProps {
  data: DashboardOverview | undefined
  isLoading: boolean
}

/**
 * Platform stats cards grid
 *
 * Displays key metrics in a responsive grid layout
 */
export function StatsGrid({ data, isLoading }: StatsGridProps) {
  if (isLoading) {
    return <StatsGridSkeleton />
  }

  if (!data) {
    return null
  }

  const stats = [
    {
      title: 'Total Users',
      value: formatNumber(data.users.total),
      subtext: `+${String(data.users.newThisWeek)} this week`,
      icon: Users,
      color: 'text-pastel-blue',
      bgColor: 'bg-pastel-blue/10',
    },
    {
      title: 'Active Apps',
      value: formatNumber(data.apps.active),
      subtext: `${String(data.apps.total)} total`,
      icon: AppWindow,
      color: 'text-pastel-green',
      bgColor: 'bg-pastel-green/10',
    },
    {
      title: 'Active Devices',
      value: formatNumber(data.devices.active),
      subtext: `iOS: ${formatNumber(data.devices.byPlatform.ios)} | Android: ${formatNumber(data.devices.byPlatform.android)}`,
      icon: Smartphone,
      color: 'text-pastel-orange',
      bgColor: 'bg-pastel-orange/10',
    },
    {
      title: 'Releases This Week',
      value: formatNumber(data.releases.thisWeek),
      subtext: `${String(data.releases.total)} total`,
      icon: Rocket,
      color: 'text-pastel-purple',
      bgColor: 'bg-pastel-purple/10',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(data.subscriptions.mrr),
      subtext: `${String(data.subscriptions.churnRate)}% churn`,
      icon: DollarSign,
      color: 'text-pastel-green',
      bgColor: 'bg-pastel-green/10',
    },
    {
      title: 'Avg Bundle Size',
      value: formatBytes(data.releases.avgBundleSize),
      subtext: 'Across all releases',
      icon: TrendingUp,
      color: 'text-pastel-blue',
      bgColor: 'bg-pastel-blue/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
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

// =============================================================================
// Formatting Helpers
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100
  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`
  }
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`
  }
  return `$${dollars.toFixed(0)}`
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
