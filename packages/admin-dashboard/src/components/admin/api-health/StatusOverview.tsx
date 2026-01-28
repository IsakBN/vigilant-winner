'use client'

import { Activity, AlertCircle, Clock, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  Badge,
  Skeleton,
  cn,
} from '@bundlenudge/shared-ui'
import type { ApiHealthStats } from '@/lib/api/types/admin'

interface StatusOverviewProps {
  data: ApiHealthStats | undefined
  isLoading: boolean
}

type HealthStatus = 'healthy' | 'degraded' | 'down'

/**
 * Displays overall API health status with key metrics
 */
export function StatusOverview({ data, isLoading }: StatusOverviewProps) {
  if (isLoading) {
    return <StatusOverviewSkeleton />
  }

  const status = getOverallStatus(data)
  const avgLatency = getAverageLatency(data?.endpoints ?? [])
  const totalErrorRate = getTotalErrorRate(data?.endpoints ?? [])
  const totalRequests = getTotalRequests(data?.endpoints ?? [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatusCard
        title="Overall Status"
        icon={Activity}
        status={status}
      />
      <MetricCard
        title="Avg Response Time"
        value={formatMs(avgLatency)}
        subtitle="across all endpoints"
        icon={Clock}
        status={avgLatency < 200 ? 'good' : avgLatency < 500 ? 'warning' : 'bad'}
      />
      <MetricCard
        title="Error Rate"
        value={`${totalErrorRate.toFixed(2)}%`}
        subtitle={`${String(data?.recentErrors.length ?? 0)} recent errors`}
        icon={AlertCircle}
        status={totalErrorRate < 1 ? 'good' : totalErrorRate < 5 ? 'warning' : 'bad'}
      />
      <MetricCard
        title="Active Connections"
        value={formatNumber(data?.activeConnections ?? 0)}
        subtitle={`${formatNumber(totalRequests)} total requests`}
        icon={Users}
        status="good"
      />
    </div>
  )
}

interface StatusCardProps {
  title: string
  icon: typeof Activity
  status: HealthStatus
}

function StatusCard({ title, icon: Icon, status }: StatusCardProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Card className={cn('border-l-4', config.borderColor)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div>
              <p className="text-sm text-text-light">{title}</p>
              <p className="text-lg font-semibold text-text-dark">{config.label}</p>
            </div>
          </div>
          <Badge variant="outline" className={config.badgeClass}>
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  icon: typeof Activity
  status: 'good' | 'warning' | 'bad'
}

function MetricCard({ title, value, subtitle, icon: Icon, status }: MetricCardProps) {
  const colors = {
    good: 'text-pastel-green',
    warning: 'text-pastel-orange',
    bad: 'text-red-500',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-5 h-5 text-text-light" />
          </div>
          <div>
            <p className="text-sm text-text-light">{title}</p>
            <p className={cn('text-xl font-bold', colors[status])}>{value}</p>
            <p className="text-xs text-text-light">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =============================================================================
// Configuration
// =============================================================================

const STATUS_CONFIG: Record<HealthStatus, {
  label: string
  borderColor: string
  bgColor: string
  iconColor: string
  badgeClass: string
}> = {
  healthy: {
    label: 'Healthy',
    borderColor: 'border-l-pastel-green',
    bgColor: 'bg-pastel-green/10',
    iconColor: 'text-pastel-green',
    badgeClass: 'bg-pastel-green/10 text-pastel-green border-pastel-green/20',
  },
  degraded: {
    label: 'Degraded',
    borderColor: 'border-l-pastel-orange',
    bgColor: 'bg-pastel-orange/10',
    iconColor: 'text-pastel-orange',
    badgeClass: 'bg-pastel-orange/10 text-pastel-orange border-pastel-orange/20',
  },
  down: {
    label: 'Down',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
  },
}

// =============================================================================
// Helpers
// =============================================================================

function getOverallStatus(data: ApiHealthStats | undefined): HealthStatus {
  if (!data) return 'down'

  const avgErrorRate = getTotalErrorRate(data.endpoints)
  const avgLatency = getAverageLatency(data.endpoints)

  if (avgErrorRate > 10 || avgLatency > 1000) return 'down'
  if (avgErrorRate > 2 || avgLatency > 500) return 'degraded'
  return 'healthy'
}

function getAverageLatency(endpoints: ApiHealthStats['endpoints']): number {
  if (endpoints.length === 0) return 0
  const total = endpoints.reduce((sum: number, e) => sum + e.avgLatency, 0)
  return total / endpoints.length
}

function getTotalErrorRate(endpoints: ApiHealthStats['endpoints']): number {
  if (endpoints.length === 0) return 0
  const totalReqs = endpoints.reduce((sum: number, e) => sum + e.requestCount, 0)
  const totalErrors = endpoints.reduce((sum: number, e) => sum + e.errorCount, 0)
  if (totalReqs === 0) return 0
  return (totalErrors / totalReqs) * 100
}

function getTotalRequests(endpoints: ApiHealthStats['endpoints']): number {
  return endpoints.reduce((sum: number, e) => sum + e.requestCount, 0)
}

function formatMs(ms: number): string {
  if (ms < 1) return '< 1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}
