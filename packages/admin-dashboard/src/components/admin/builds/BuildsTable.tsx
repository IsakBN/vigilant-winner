'use client'

import { RefreshCw, XCircle, Loader2 } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Skeleton,
} from '@bundlenudge/shared-ui'
import { BuildStatusBadge } from './BuildStatusBadge'
import type { BuildJob, BuildJobStatus } from '@/lib/api/types/admin'

interface BuildsTableProps {
  jobs: BuildJob[]
  isLoading: boolean
  onCancel: (buildId: string) => void
  onRetry: (buildId: string) => void
  cancellingId: string | null
  retryingId: string | null
  statusFilter: BuildJobStatus | 'all'
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

function formatDuration(startedAt: number | null, completedAt: number | null): string {
  if (!startedAt) return '-'
  const end = completedAt ?? Date.now()
  const durationMs = end - startedAt
  const seconds = Math.floor(durationMs / 1000)
  if (seconds < 60) return `${String(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes)}m ${String(remainingSeconds)}s`
}

/**
 * Table displaying build queue jobs with actions
 */
export function BuildsTable({
  jobs,
  isLoading,
  onCancel,
  onRetry,
  cancellingId,
  retryingId,
  statusFilter,
}: BuildsTableProps) {
  const filteredJobs = statusFilter === 'all'
    ? jobs
    : jobs.filter((job) => job.status === statusFilter)

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>App</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={`skeleton-${String(i)}`}>
              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No builds found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>App</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredJobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell>
              <BuildStatusBadge status={job.status} />
            </TableCell>
            <TableCell className="font-medium">
              {job.appName || job.appId.slice(0, 8)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {job.version}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatTime(job.startedAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDuration(job.startedAt, job.completedAt)}
            </TableCell>
            <TableCell>
              <BuildActions
                job={job}
                onCancel={onCancel}
                onRetry={onRetry}
                cancellingId={cancellingId}
                retryingId={retryingId}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface BuildActionsProps {
  job: BuildJob
  onCancel: (buildId: string) => void
  onRetry: (buildId: string) => void
  cancellingId: string | null
  retryingId: string | null
}

function BuildActions({
  job,
  onCancel,
  onRetry,
  cancellingId,
  retryingId,
}: BuildActionsProps) {
  const isCancelling = cancellingId === job.id
  const isRetrying = retryingId === job.id
  const canCancel = job.status === 'queued' || job.status === 'building'
  const canRetry = job.status === 'failed'

  if (!canCancel && !canRetry) {
    return <span className="text-sm text-muted-foreground">-</span>
  }

  return (
    <div className="flex items-center gap-2">
      {canCancel && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCancel(job.id)}
          disabled={isCancelling}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isCancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="ml-1">Cancel</span>
        </Button>
      )}
      {canRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRetry(job.id)}
          disabled={isRetrying}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1">Retry</span>
        </Button>
      )}
    </div>
  )
}
