'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge } from '@bundlenudge/shared-ui'
import { useSystemLogs, useExportLogs } from '@/hooks/useAdminOps'
import { LogsFilters, LogsTable } from '@/components/admin/logs'
import type { ListLogsParams, LogEntry } from '@/lib/api/types/admin'

const DEFAULT_FILTERS: ListLogsParams = {
  page: 1,
  limit: 20,
}

export default function SystemLogsPage() {
  const [filters, setFilters] = useState<ListLogsParams>(DEFAULT_FILTERS)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)

  const { data, isLoading, error } = useSystemLogs(filters)
  const exportMutation = useExportLogs()

  const handleFiltersChange = useCallback((newFilters: ListLogsParams) => {
    setFilters(newFilters)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev: ListLogsParams) => ({ ...prev, page }))
  }, [])

  const handleExport = useCallback(() => {
    exportMutation.mutate(filters)
  }, [exportMutation, filters])

  const handleLogClick = useCallback((log: LogEntry) => {
    setSelectedLog(log)
  }, [])

  // Auto-refresh indicator for error logs
  const isAutoRefreshing = filters.level === 'error'

  return (
    <div className="space-y-6">
      <Header total={data?.total} isAutoRefreshing={isAutoRefreshing} />

      <LogsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        isExporting={exportMutation.isPending}
      />

      {error && <ErrorBanner message={error.message} />}

      <LogsTable
        data={data}
        isLoading={isLoading}
        page={filters.page ?? 1}
        onPageChange={handlePageChange}
        onLogClick={handleLogClick}
      />

      <LogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}

interface HeaderProps {
  total?: number
  isAutoRefreshing: boolean
}

function Header({ total, isAutoRefreshing }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">System Logs</h1>
        {total !== undefined && (
          <span className="text-gray-500">({String(total)} entries)</span>
        )}
      </div>
      {isAutoRefreshing && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          Auto-refreshing (5s)
        </div>
      )}
    </div>
  )
}

interface ErrorBannerProps {
  message: string
}

function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {message}
    </div>
  )
}

interface LogDetailDialogProps {
  log: LogEntry | null
  onClose: () => void
}

function LogDetailDialog({ log, onClose }: LogDetailDialogProps) {
  if (!log) return null

  const levelStyles: Record<string, string> = {
    error: 'bg-red-100 text-red-800',
    warn: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    debug: 'bg-gray-100 text-gray-800',
  }

  return (
    <Dialog open={Boolean(log)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Log Details
            <Badge className={levelStyles[log.level] ?? ''}>
              {log.level.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DetailRow label="Timestamp" value={formatFullTimestamp(log.timestamp)} />
          <DetailRow label="Service" value={log.service} />
          <DetailRow label="Message" value={log.message} />

          {Object.keys(log.metadata).length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-500">Metadata</span>
              <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-auto max-h-64">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </div>
  )
}

function formatFullTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })
}

