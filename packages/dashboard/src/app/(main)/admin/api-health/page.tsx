'use client'

/**
 * Admin API Health Page
 *
 * Monitor API endpoint health, latency, and rate limiting stats.
 */

import { useApiHealth } from '@/hooks/useAdminOps'
import {
  Card,
  CardContent,
  Button,
} from '@/components/ui'
import {
  Activity,
  AlertTriangle,
  Users,
  RefreshCw,
  ShieldOff,
} from 'lucide-react'
import {
  EndpointsTable,
  RateLimitCard,
  RecentErrorsCard,
  ApiHealthSkeleton,
} from './components'

export default function AdminApiHealthPage() {
  const { data, isLoading, error, refetch, isFetching } = useApiHealth()

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Failed to load API health. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={() => void refetch()} isRefreshing={isFetching} />

      {isLoading ? (
        <ApiHealthSkeleton />
      ) : data ? (
        <>
          <StatsRow
            activeConnections={data.activeConnections}
            totalBlocked={data.rateLimiting.totalBlocked}
            endpointCount={data.endpoints.length}
            errorCount={data.recentErrors.length}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <EndpointsTable endpoints={data.endpoints} />
            <div className="space-y-6">
              <RateLimitCard data={data.rateLimiting} />
              <RecentErrorsCard errors={data.recentErrors} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

interface PageHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
}

function PageHeader({ onRefresh, isRefreshing }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">API Health</h1>
        <p className="text-text-light mt-1">Monitor endpoint latency and rate limiting</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  )
}

interface StatsRowProps {
  activeConnections: number
  totalBlocked: number
  endpointCount: number
  errorCount: number
}

function StatsRow({ activeConnections, totalBlocked, endpointCount, errorCount }: StatsRowProps) {
  const stats = [
    { label: 'Active Connections', value: activeConnections, icon: Users, color: 'text-pastel-blue' },
    { label: 'Endpoints', value: endpointCount, icon: Activity, color: 'text-pastel-green' },
    { label: 'Rate Limited', value: totalBlocked, icon: ShieldOff, color: 'text-pastel-yellow' },
    { label: 'Recent Errors', value: errorCount, icon: AlertTriangle, color: 'text-destructive' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div>
                <p className="text-xl font-bold text-text-dark">{stat.value}</p>
                <p className="text-xs text-text-light">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
