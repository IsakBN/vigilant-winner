'use client'

import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApiHealthStats, BuildQueueStats, StorageMetrics } from '@/lib/api'

type StatusLevel = 'healthy' | 'warning' | 'critical' | 'loading'

interface SystemStatusBarProps {
  apiHealth: ApiHealthStats | undefined
  buildQueue: BuildQueueStats | undefined
  storage: StorageMetrics | undefined
  isLoading: boolean
}

interface StatusIndicator {
  name: string
  status: StatusLevel
}

/**
 * Quick system health status bar with colored indicators
 */
export function SystemStatusBar({
  apiHealth,
  buildQueue,
  storage,
  isLoading,
}: SystemStatusBarProps) {
  const indicators = getIndicators(apiHealth, buildQueue, storage, isLoading)

  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-white rounded-lg border border-border">
      <span className="text-sm font-medium text-text-dark">System Status</span>
      <div className="flex items-center gap-4">
        {indicators.map((indicator) => (
          <div key={indicator.name} className="flex items-center gap-2">
            <Circle
              className={cn('w-2.5 h-2.5 fill-current', STATUS_COLORS[indicator.status])}
            />
            <span className="text-xs text-text-light">{indicator.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getIndicators(
  apiHealth: ApiHealthStats | undefined,
  buildQueue: BuildQueueStats | undefined,
  storage: StorageMetrics | undefined,
  isLoading: boolean
): StatusIndicator[] {
  if (isLoading) {
    return [
      { name: 'API', status: 'loading' },
      { name: 'Database', status: 'loading' },
      { name: 'Storage', status: 'loading' },
      { name: 'Workers', status: 'loading' },
    ]
  }

  const apiStatus = getApiStatus(apiHealth)
  const dbStatus = getDatabaseStatus(apiHealth)
  const storageStatus = getStorageStatus(storage)
  const workerStatus = getWorkerStatus(buildQueue)

  return [
    { name: 'API', status: apiStatus },
    { name: 'Database', status: dbStatus },
    { name: 'Storage', status: storageStatus },
    { name: 'Workers', status: workerStatus },
  ]
}

function getApiStatus(health: ApiHealthStats | undefined): StatusLevel {
  if (!health) return 'critical'
  const totalErrors = health.endpoints.reduce((sum, e) => sum + e.errorRate, 0)
  const avgErrorRate = totalErrors / (health.endpoints.length || 1)
  if (avgErrorRate > 5) return 'critical'
  if (avgErrorRate > 1) return 'warning'
  return 'healthy'
}

function getDatabaseStatus(health: ApiHealthStats | undefined): StatusLevel {
  if (!health) return 'critical'
  const avgLatency = health.endpoints.reduce((sum, e) => sum + e.avgLatency, 0) /
    (health.endpoints.length || 1)
  if (avgLatency > 500) return 'critical'
  if (avgLatency > 200) return 'warning'
  return 'healthy'
}

function getStorageStatus(storage: StorageMetrics | undefined): StatusLevel {
  if (!storage) return 'critical'
  const capacityGb = 10 * 1024 * 1024 * 1024 // 10GB assumed limit
  const usagePercent = (storage.totalBytes / capacityGb) * 100
  if (usagePercent > 90) return 'critical'
  if (usagePercent > 75) return 'warning'
  return 'healthy'
}

function getWorkerStatus(queue: BuildQueueStats | undefined): StatusLevel {
  if (!queue) return 'critical'
  const offlineWorkers = queue.workers.filter((w) => w.status === 'offline').length
  if (offlineWorkers === queue.workers.length) return 'critical'
  if (offlineWorkers > 0) return 'warning'
  return 'healthy'
}

const STATUS_COLORS: Record<StatusLevel, string> = {
  healthy: 'text-pastel-green',
  warning: 'text-pastel-orange',
  critical: 'text-red-500',
  loading: 'text-gray-300 animate-pulse',
}
