'use client'

import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  cn,
} from '@bundlenudge/shared-ui'
import type {
  BuildQueueStats,
  StorageMetrics,
  ApiHealthStats,
} from '@/lib/api/types/admin'

interface AlertsSectionProps {
  buildQueue: BuildQueueStats | undefined
  storage: StorageMetrics | undefined
  apiHealth: ApiHealthStats | undefined
  isLoading: boolean
}

interface Alert {
  id: string
  severity: 'warning' | 'critical'
  message: string
}

/**
 * Operational alerts section showing warnings and critical issues
 */
export function AlertsSection({
  buildQueue,
  storage,
  apiHealth,
  isLoading,
}: AlertsSectionProps) {
  if (isLoading) {
    return <AlertsSectionSkeleton />
  }

  const alerts = generateAlerts(buildQueue, storage, apiHealth)

  if (alerts.length === 0) {
    return null
  }

  return (
    <Card className="border-pastel-orange/30 bg-pastel-orange/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-text-dark flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-pastel-orange" />
          Alerts
          <Badge variant="outline" className="ml-2 bg-pastel-orange/10 text-pastel-orange">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AlertRow({ alert }: { alert: Alert }) {
  const isCritical = alert.severity === 'critical'

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md',
        isCritical ? 'bg-red-50' : 'bg-white'
      )}
    >
      {isCritical ? (
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-pastel-orange flex-shrink-0" />
      )}
      <span className="text-sm text-text-dark">{alert.message}</span>
      <Badge
        variant="outline"
        className={cn(
          'ml-auto text-xs',
          isCritical
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-pastel-orange/10 text-pastel-orange border-pastel-orange/20'
        )}
      >
        {alert.severity}
      </Badge>
    </div>
  )
}

function AlertsSectionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function generateAlerts(
  buildQueue: BuildQueueStats | undefined,
  storage: StorageMetrics | undefined,
  apiHealth: ApiHealthStats | undefined
): Alert[] {
  const alerts: Alert[] = []

  // Build queue alerts
  if (buildQueue) {
    if (buildQueue.failedToday > 5) {
      alerts.push({
        id: 'failed-builds',
        severity: buildQueue.failedToday > 10 ? 'critical' : 'warning',
        message: `${String(buildQueue.failedToday)} builds failed today`,
      })
    }
    if (buildQueue.queueDepth > 20) {
      alerts.push({
        id: 'queue-depth',
        severity: buildQueue.queueDepth > 50 ? 'critical' : 'warning',
        message: `Build queue has ${String(buildQueue.queueDepth)} pending jobs`,
      })
    }
    const offlineWorkers = buildQueue.workers.filter((w) => w.status === 'offline').length
    if (offlineWorkers > 0) {
      alerts.push({
        id: 'offline-workers',
        severity: offlineWorkers === buildQueue.workers.length ? 'critical' : 'warning',
        message: `${String(offlineWorkers)} of ${String(buildQueue.workers.length)} workers offline`,
      })
    }
  }

  // Storage alerts
  if (storage) {
    const capacityGb = 10 * 1024 * 1024 * 1024 // 10GB limit
    const usagePercent = (storage.totalBytes / capacityGb) * 100
    if (usagePercent > 75) {
      alerts.push({
        id: 'storage-capacity',
        severity: usagePercent > 90 ? 'critical' : 'warning',
        message: `Storage at ${usagePercent.toFixed(0)}% capacity`,
      })
    }
    if (storage.orphanedBundles > 100) {
      alerts.push({
        id: 'orphaned-bundles',
        severity: 'warning',
        message: `${String(storage.orphanedBundles)} orphaned bundles need cleanup`,
      })
    }
  }

  // API health alerts
  if (apiHealth) {
    const highErrorEndpoints = apiHealth.endpoints.filter((e) => e.errorRate > 5)
    if (highErrorEndpoints.length > 0) {
      alerts.push({
        id: 'high-error-rate',
        severity: highErrorEndpoints.some((e) => e.errorRate > 10) ? 'critical' : 'warning',
        message: `${String(highErrorEndpoints.length)} endpoints have high error rates`,
      })
    }
    if (apiHealth.rateLimiting.totalBlocked > 1000) {
      alerts.push({
        id: 'rate-limiting',
        severity: 'warning',
        message: `${String(apiHealth.rateLimiting.totalBlocked)} requests blocked by rate limiting`,
      })
    }
  }

  return alerts.sort((a, _b) => (a.severity === 'critical' ? -1 : 1))
}
