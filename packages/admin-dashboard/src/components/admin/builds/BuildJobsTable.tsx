'use client'

import { Play, X, RefreshCw, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Skeleton,
} from '@bundlenudge/shared-ui'
import { formatRelativeTime } from '@bundlenudge/shared-ui'
import type { BuildJob, BuildJobStatus } from '@/lib/api/types/admin'

interface BuildJobsTableProps {
  jobs: BuildJob[]
  isLoading: boolean
  onCancel: (jobId: string) => void
  onRetry: (jobId: string) => void
  cancellingId: string | null
  retryingId: string | null
}

/**
 * Table showing active and queued build jobs
 */
export function BuildJobsTable({
  jobs,
  isLoading,
  onCancel,
  onRetry,
  cancellingId,
  retryingId,
}: BuildJobsTableProps) {
  // Filter to show only active/queued jobs (not completed)
  const activeJobs = jobs.filter(
    (job) => job.status === 'queued' || job.status === 'building' || job.status === 'uploading'
  )
  const failedJobs = jobs.filter((job) => job.status === 'failed')
  const displayJobs = [...activeJobs, ...failedJobs]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Active & Queued Jobs
          {displayJobs.length > 0 && (
            <Badge className="ml-2 bg-blue-100 text-blue-700">
              {displayJobs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead>App</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : displayJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-muted-foreground">No active or queued jobs</p>
                </TableCell>
              </TableRow>
            ) : (
              displayJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onCancel={onCancel}
                  onRetry={onRetry}
                  isCancelling={cancellingId === job.id}
                  isRetrying={retryingId === job.id}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface JobRowProps {
  job: BuildJob
  onCancel: (jobId: string) => void
  onRetry: (jobId: string) => void
  isCancelling: boolean
  isRetrying: boolean
}

function JobRow({ job, onCancel, onRetry, isCancelling, isRetrying }: JobRowProps) {
  const canCancel = job.status === 'queued' || job.status === 'building'
  const canRetry = job.status === 'failed'

  return (
    <TableRow>
      <TableCell>
        <StatusBadge status={job.status} />
      </TableCell>
      <TableCell className="font-medium">
        {job.appName || job.appId.slice(0, 8)}
      </TableCell>
      <TableCell className="text-muted-foreground">{job.version}</TableCell>
      <TableCell>
        <ProgressIndicator status={job.status} progress={job.progress} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {job.startedAt ? formatRelativeTime(job.startedAt) : '-'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(job.id)}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1">Retry</span>
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(job.id)}
              disabled={isCancelling}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isCancelling ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span className="ml-1">Cancel</span>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function StatusBadge({ status }: { status: BuildJobStatus }) {
  const config: Record<BuildJobStatus, { label: string; className: string }> = {
    queued: { label: 'Queued', className: 'bg-gray-100 text-gray-700' },
    building: { label: 'Building', className: 'bg-blue-100 text-blue-700' },
    uploading: { label: 'Uploading', className: 'bg-purple-100 text-purple-700' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
  }

  const { label, className } = config[status]

  return (
    <Badge className={className}>
      {status === 'building' && <Play className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  )
}

function ProgressIndicator({ status, progress }: { status: BuildJobStatus; progress: number }) {
  if (status === 'queued') {
    return <span className="text-muted-foreground">Waiting...</span>
  }

  if (status === 'failed') {
    return <span className="text-red-600">Failed</span>
  }

  if (status === 'completed') {
    return <span className="text-green-600">Done</span>
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${String(progress)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}
