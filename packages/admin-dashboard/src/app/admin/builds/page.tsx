'use client'

import { useState, useCallback, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge, Button } from '@bundlenudge/shared-ui'
import {
  BuildQueueCard,
  BuildJobsTable,
  BuildsFilters,
  WorkersStatus,
} from '@/components/admin/builds'
import type { StatusFilter } from '@/components/admin/builds'
import { useBuildQueue, useCancelBuild, useRetryBuild } from '@/hooks/useAdminOps'

/**
 * Admin build queue management page
 *
 * Shows queue stats, active jobs, and allows cancel/retry actions.
 * Auto-refreshes every 5 seconds via the useBuildQueue hook.
 */
export default function BuildsPage() {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data, isLoading, refetch, dataUpdatedAt } = useBuildQueue()
  const cancelBuild = useCancelBuild()
  const retryBuild = useRetryBuild()

  const handleCancel = useCallback(async (jobId: string) => {
    setCancellingId(jobId)
    try {
      await cancelBuild.mutateAsync(jobId)
    } finally {
      setCancellingId(null)
    }
  }, [cancelBuild])

  const handleRetry = useCallback(async (jobId: string) => {
    setRetryingId(jobId)
    try {
      await retryBuild.mutateAsync(jobId)
    } finally {
      setRetryingId(null)
    }
  }, [retryBuild])

  const filteredJobs = useMemo(() => {
    const jobs = data?.jobs ?? []
    if (statusFilter === 'all') return jobs
    return jobs.filter((job) => job.status === statusFilter)
  }, [data?.jobs, statusFilter])

  const lastRefresh = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date()
  const totalQueueDepth = data?.queueDepth ?? 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Build Queue</h1>
          {totalQueueDepth > 0 && (
            <Badge className="bg-blue-100 text-blue-700">
              {totalQueueDepth} in queue
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Queue Stats Cards */}
      <BuildQueueCard
        queueDepth={data?.queueDepth ?? 0}
        activeJobs={data?.activeJobs ?? 0}
        completedToday={data?.completedToday ?? 0}
        failedToday={data?.failedToday ?? 0}
        avgBuildTime={data?.avgBuildTime ?? 0}
        workers={data?.workers ?? []}
        isLoading={isLoading}
      />

      {/* Workers Status */}
      <WorkersStatus workers={data?.workers} isLoading={isLoading} />

      {/* Filter Section */}
      <div className="flex items-center justify-between">
        <BuildsFilters statusFilter={statusFilter} onStatusChange={setStatusFilter} />
        <span className="text-sm text-muted-foreground">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Active Jobs Table */}
      <BuildJobsTable
        jobs={filteredJobs}
        isLoading={isLoading}
        onCancel={handleCancel}
        onRetry={handleRetry}
        cancellingId={cancellingId}
        retryingId={retryingId}
      />
    </div>
  )
}

