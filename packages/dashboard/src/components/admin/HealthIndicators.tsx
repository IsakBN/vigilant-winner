'use client'

import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SystemAlert, AlertSeverity } from '@/lib/api'

interface HealthIndicatorsProps {
  alerts: SystemAlert[] | undefined
  isLoading: boolean
}

/**
 * System health status indicators
 *
 * Displays active system alerts sorted by severity
 */
export function HealthIndicators({ alerts, isLoading }: HealthIndicatorsProps) {
  if (isLoading) {
    return <HealthIndicatorsSkeleton />
  }

  const activeAlerts = alerts?.filter((a) => !a.resolvedAt) ?? []
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length

  const overallStatus = getOverallStatus(criticalCount, warningCount)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-text-dark">
          System Health
        </CardTitle>
        <StatusBadge status={overallStatus} />
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-full bg-pastel-green/10">
              <CheckCircle className="w-5 h-5 text-pastel-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-dark">
                All systems operational
              </p>
              <p className="text-xs text-text-light">
                No active alerts at this time
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
            {activeAlerts.length > 5 && (
              <p className="text-xs text-text-light text-center pt-2">
                +{activeAlerts.length - 5} more alerts
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AlertItemProps {
  alert: SystemAlert
}

function AlertItem({ alert }: AlertItemProps) {
  const config = SEVERITY_CONFIG[alert.severity]

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg', config.bgColor)}>
      <div className={cn('p-1.5 rounded-full', config.iconBg)}>
        <config.icon className={cn('w-4 h-4', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-dark">{alert.message}</p>
        <p className="text-xs text-text-light mt-0.5">
          {formatTimestamp(alert.createdAt)}
        </p>
      </div>
      <SeverityBadge severity={alert.severity} />
    </div>
  )
}

interface StatusBadgeProps {
  status: 'healthy' | 'warning' | 'critical'
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    healthy: { label: 'Healthy', className: 'bg-pastel-green/10 text-pastel-green border-pastel-green/20' },
    warning: { label: 'Warning', className: 'bg-pastel-orange/10 text-pastel-orange border-pastel-orange/20' },
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
  }

  return (
    <Badge variant="outline" className={config[status].className}>
      {config[status].label}
    </Badge>
  )
}

interface SeverityBadgeProps {
  severity: AlertSeverity
}

function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    info: { label: 'Info', className: 'bg-pastel-blue/10 text-pastel-blue border-pastel-blue/20' },
    warning: { label: 'Warning', className: 'bg-pastel-orange/10 text-pastel-orange border-pastel-orange/20' },
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
  }

  return (
    <Badge variant="outline" className={cn('text-xs', config[severity].className)}>
      {config[severity].label}
    </Badge>
  )
}

function HealthIndicatorsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Configuration
// =============================================================================

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    icon: typeof AlertCircle
    bgColor: string
    iconBg: string
    iconColor: string
  }
> = {
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-pastel-orange/10',
    iconBg: 'bg-pastel-orange/20',
    iconColor: 'text-pastel-orange',
  },
  info: {
    icon: Info,
    bgColor: 'bg-pastel-blue/10',
    iconBg: 'bg-pastel-blue/20',
    iconColor: 'text-pastel-blue',
  },
}

// =============================================================================
// Helpers
// =============================================================================

function getOverallStatus(
  criticalCount: number,
  warningCount: number
): 'healthy' | 'warning' | 'critical' {
  if (criticalCount > 0) return 'critical'
  if (warningCount > 0) return 'warning'
  return 'healthy'
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
