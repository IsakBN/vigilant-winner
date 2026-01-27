'use client'

/**
 * Admin System Logs Page
 *
 * Real-time log viewer with filtering, search, and export.
 */

import { useState, useEffect } from 'react'
import { useSystemLogs, useExportLogs } from '@/hooks/useAdminOps'
import { Button } from '@/components/ui'
import { RefreshCw, Download, Pause, Play } from 'lucide-react'
import { LogsTable, FiltersBar, LogsSkeleton } from './components'
import type { LogLevel, LogService, ListLogsParams } from '@/lib/api'

export default function AdminLogsPage() {
  const [filters, setFilters] = useState<ListLogsParams>({ limit: 50 })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch, isFetching } = useSystemLogs({
    ...filters,
    search: search || undefined,
  })
  const exportLogs = useExportLogs()

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Failed to load logs. Please try again.</div>
      </div>
    )
  }

  const handleExport = () => {
    exportLogs.mutate(filters)
  }

  const handleLevelChange = (level: LogLevel | undefined) => {
    setFilters({ ...filters, level, page: 1 })
  }

  const handleServiceChange = (service: LogService | undefined) => {
    setFilters({ ...filters, service, page: 1 })
  }

  const handleLoadMore = () => {
    setFilters({ ...filters, page: (filters.page ?? 1) + 1 })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onRefresh={() => void refetch()}
        onExport={handleExport}
        isRefreshing={isFetching}
        isExporting={exportLogs.isPending}
      />

      <FiltersBar
        search={search}
        onSearchChange={setSearch}
        level={filters.level}
        onLevelChange={handleLevelChange}
        service={filters.service}
        onServiceChange={handleServiceChange}
      />

      {isLoading ? (
        <LogsSkeleton />
      ) : (
        <LogsTable
          logs={data?.logs ?? []}
          total={data?.total ?? 0}
          hasMore={data?.hasMore ?? false}
          onLoadMore={handleLoadMore}
        />
      )}
    </div>
  )
}

interface PageHeaderProps {
  autoRefresh: boolean
  onToggleAutoRefresh: () => void
  onRefresh: () => void
  onExport: () => void
  isRefreshing: boolean
  isExporting: boolean
}

function PageHeader({
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  onExport,
  isRefreshing,
  isExporting,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">System Logs</h1>
        <p className="text-text-light mt-1">Real-time log viewer with filtering</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleAutoRefresh}
        >
          {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  )
}
