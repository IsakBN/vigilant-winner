'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button, Badge, ErrorState } from '@bundlenudge/shared-ui'
import { useStorageMetrics } from '@/hooks/useAdminOps'
import {
  StorageOverviewCards,
  TopConsumersTable,
  LargestBundlesTable,
  StorageGrowthChart,
  OrphanedBundlesCard,
} from '@/components/admin/storage'

const REFRESH_INTERVAL = 60000 // 60 seconds

/**
 * Admin storage metrics page
 *
 * Displays storage usage stats, top consumers, largest bundles,
 * growth trends, and orphaned bundle cleanup functionality.
 */
export default function StoragePage() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { data, isLoading, isError, error, refetch } = useStorageMetrics()

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void refetch()
      setLastRefresh(new Date())
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refetch])

  const handleManualRefresh = () => {
    void refetch()
    setLastRefresh(new Date())
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load storage metrics"
          message={error instanceof Error ? error.message : 'Unknown error'}
          onRetry={handleManualRefresh}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Storage</h1>
          <p className="text-muted-foreground">
            Monitor storage usage and manage orphaned bundles
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Badge variant="outline" className="text-xs">
            Auto-refresh: 60s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <StorageOverviewCards data={data} isLoading={isLoading} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Growth Chart - Spans 2 columns */}
        <div className="lg:col-span-2">
          <StorageGrowthChart data={data?.growthHistory} isLoading={isLoading} />
        </div>

        {/* Orphaned Bundles Card */}
        <div>
          <OrphanedBundlesCard
            orphanedCount={data?.orphanedBundles}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopConsumersTable data={data?.byApp} isLoading={isLoading} />
        <LargestBundlesTable data={data?.largestBundles} isLoading={isLoading} />
      </div>
    </div>
  )
}

