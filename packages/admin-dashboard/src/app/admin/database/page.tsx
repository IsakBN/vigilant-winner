'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Database } from 'lucide-react'
import { Button } from '@bundlenudge/shared-ui'
import { useDatabaseStats } from '@/hooks/useAdminOps'
import {
  DatabaseOverviewCards,
  TableRowCounts,
  SlowQueriesTable,
  QueryMetricsCard,
  TableGrowthChart,
} from '@/components/admin/database'

const REFRESH_INTERVAL = 60000

/**
 * Database statistics dashboard page
 *
 * Displays database health metrics including table sizes, row counts,
 * query performance, and slow queries.
 */
export default function DatabasePage() {
  const { data, isLoading, refetch, dataUpdatedAt } = useDatabaseStats()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt))
    }
  }, [dataUpdatedAt])

  const handleManualRefresh = () => {
    void refetch()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pastel-blue/10">
            <Database className="h-6 w-6 text-pastel-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Database</h1>
            <p className="text-sm text-muted-foreground">
              Monitor database health and performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Updated {formatTimeAgo(lastRefresh)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <DatabaseOverviewCards data={data} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <QueryMetricsCard metrics={data?.queryMetrics} isLoading={isLoading} />
        <TableGrowthChart tables={data?.tables} isLoading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TableRowCounts tables={data?.tables} isLoading={isLoading} />
        <SlowQueriesTable queries={data?.slowQueries} isLoading={isLoading} />
      </div>

      <AutoRefreshIndicator intervalMs={REFRESH_INTERVAL} />
    </div>
  )
}

interface AutoRefreshIndicatorProps {
  intervalMs: number
}

function AutoRefreshIndicator({ intervalMs }: AutoRefreshIndicatorProps) {
  return (
    <div className="flex items-center justify-center text-xs text-muted-foreground">
      <RefreshCw className="h-3 w-3 mr-1" />
      Auto-refreshes every {String(intervalMs / 1000)} seconds
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) {
    return 'just now'
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${String(minutes)} min${minutes === 1 ? '' : 's'} ago`
  }
  const hours = Math.floor(seconds / 3600)
  return `${String(hours)} hour${hours === 1 ? '' : 's'} ago`
}

