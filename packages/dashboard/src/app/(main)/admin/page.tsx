'use client'

import { useAdminStats, useSystemHealth, useRecentActivity } from '@/hooks/useAdmin'
import { StatsGrid, HealthIndicators, ActivityFeed } from '@/components/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'

/**
 * Admin dashboard home page
 *
 * Displays platform-wide stats, system health, and recent activity
 */
export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading, dataUpdatedAt } = useAdminStats()
  const { data: healthData, isLoading: healthLoading } = useSystemHealth({ limit: 10 })
  const { data: activityData, isLoading: activityLoading } = useRecentActivity({
    limit: 10,
  })

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Platform Overview</h1>
          <p className="text-sm text-text-light mt-1">
            Monitor your platform metrics and system health
          </p>
        </div>
        {stats?.cached && (
          <CacheIndicator generatedAt={stats.generatedAt} updatedAt={dataUpdatedAt} />
        )}
      </div>

      {/* Stats grid */}
      <StatsGrid data={stats} isLoading={statsLoading} />

      {/* Subscription breakdown */}
      {stats && <SubscriptionBreakdown data={stats.subscriptions.byPlan} />}

      {/* Two column layout for health and activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HealthIndicators alerts={healthData?.items} isLoading={healthLoading} />
        <ActivityFeed items={activityData?.items} isLoading={activityLoading} />
      </div>
    </div>
  )
}

interface CacheIndicatorProps {
  generatedAt?: number
  updatedAt: number
}

function CacheIndicator({ generatedAt, updatedAt }: CacheIndicatorProps) {
  const age = generatedAt ? Math.floor((Date.now() - generatedAt) / 1000) : 0
  const localAge = Math.floor((Date.now() - updatedAt) / 1000)

  return (
    <div className="flex items-center gap-2 text-xs text-text-light">
      <RefreshCw className="w-3 h-3" />
      <span>
        Cached {age > 0 ? `${age}s` : 'just now'} (fetched {localAge}s ago)
      </span>
    </div>
  )
}

interface SubscriptionBreakdownProps {
  data: Record<string, number>
}

function SubscriptionBreakdown({ data }: SubscriptionBreakdownProps) {
  const plans = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = plans.reduce((sum, [, count]) => sum + count, 0)

  if (plans.length === 0) {
    return null
  }

  const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-pastel-blue/20 text-pastel-blue',
    team: 'bg-pastel-green/20 text-pastel-green',
    enterprise: 'bg-pastel-purple/20 text-pastel-purple',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-dark">
          Subscription Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {plans.map(([plan, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
            const colorClass = PLAN_COLORS[plan.toLowerCase()] ?? 'bg-gray-100 text-gray-700'

            return (
              <div key={plan} className="flex items-center gap-3">
                <Badge variant="outline" className={colorClass}>
                  {plan}
                </Badge>
                <div className="text-sm">
                  <span className="font-semibold text-text-dark">{count}</span>
                  <span className="text-text-light ml-1">({percentage}%)</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Visual bar */}
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden flex">
          {plans.map(([plan, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0
            const barColors: Record<string, string> = {
              free: 'bg-gray-300',
              pro: 'bg-pastel-blue',
              team: 'bg-pastel-green',
              enterprise: 'bg-pastel-purple',
            }
            const barColor = barColors[plan.toLowerCase()] ?? 'bg-gray-300'

            return (
              <div
                key={plan}
                className={barColor}
                style={{ width: `${percentage}%` }}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
