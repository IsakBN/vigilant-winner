'use client'

/**
 * Admin Build Queue Page
 *
 * Monitor build jobs, queue depth, and worker health.
 */

import { useBuildQueue, useCancelBuild, useRetryBuild } from '@/hooks/useAdminOps'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Hammer,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Server,
  RefreshCw,
  X,
  RotateCcw,
} from 'lucide-react'
import type { BuildJob, BuildWorker } from '@/lib/api'

export default function AdminBuildsPage() {
  const { data, isLoading, error, refetch, isFetching } = useBuildQueue()
  const cancelBuild = useCancelBuild()
  const retryBuild = useRetryBuild()

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Failed to load build queue. Please try again.</div>
      </div>
    )
  }

  const handleCancel = (jobId: string) => {
    if (confirm('Cancel this build?')) {
      cancelBuild.mutate(jobId)
    }
  }

  const handleRetry = (jobId: string) => {
    retryBuild.mutate(jobId)
  }

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={() => void refetch()} isRefreshing={isFetching} />

      {isLoading ? (
        <BuildQueueSkeleton />
      ) : data ? (
        <>
          <StatsRow data={data} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <JobsTable
                jobs={data.jobs}
                onCancel={handleCancel}
                onRetry={handleRetry}
                isCanceling={cancelBuild.isPending}
                isRetrying={retryBuild.isPending}
              />
            </div>
            <WorkersCard workers={data.workers} />
          </div>
        </>
      ) : null}
    </div>
  )
}

interface PageHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
}

function PageHeader({ onRefresh, isRefreshing }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Build Queue</h1>
        <p className="text-text-light mt-1">Monitor build jobs and worker status</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  )
}

interface StatsRowProps {
  data: {
    queueDepth: number
    activeJobs: number
    completedToday: number
    failedToday: number
    avgBuildTime: number
  }
}

function StatsRow({ data }: StatsRowProps) {
  const stats = [
    { label: 'Queue Depth', value: data.queueDepth, icon: Clock, color: 'text-pastel-blue' },
    { label: 'Active', value: data.activeJobs, icon: Loader2, color: 'text-pastel-yellow' },
    { label: 'Completed Today', value: data.completedToday, icon: CheckCircle, color: 'text-pastel-green' },
    { label: 'Failed Today', value: data.failedToday, icon: XCircle, color: 'text-destructive' },
    { label: 'Avg Build Time', value: `${String(Math.round(data.avgBuildTime / 1000))}s`, icon: Hammer, color: 'text-pastel-purple' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div>
                <p className="text-xl font-bold text-text-dark">{stat.value}</p>
                <p className="text-xs text-text-light">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface JobsTableProps {
  jobs: BuildJob[]
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  isCanceling: boolean
  isRetrying: boolean
}

function JobsTable({ jobs, onCancel, onRetry, isCanceling, isRetrying }: JobsTableProps) {
  const statusConfig: Record<BuildJob['status'], { icon: typeof CheckCircle; color: string }> = {
    queued: { icon: Clock, color: 'bg-gray-100 text-gray-700' },
    building: { icon: Loader2, color: 'bg-pastel-yellow/20 text-pastel-yellow' },
    uploading: { icon: Loader2, color: 'bg-pastel-blue/20 text-pastel-blue' },
    completed: { icon: CheckCircle, color: 'bg-pastel-green/20 text-pastel-green' },
    failed: { icon: XCircle, color: 'bg-destructive/20 text-destructive' },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Build Jobs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {jobs.length === 0 ? (
          <div className="py-12 text-center text-text-light">No builds in queue</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 text-sm font-medium text-text-light">App</th>
                <th className="text-left p-4 text-sm font-medium text-text-light">Version</th>
                <th className="text-left p-4 text-sm font-medium text-text-light">Status</th>
                <th className="text-left p-4 text-sm font-medium text-text-light">Started</th>
                <th className="text-right p-4 text-sm font-medium text-text-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const config = statusConfig[job.status]
                const StatusIcon = config.icon
                const isActive = job.status === 'building' || job.status === 'uploading'

                return (
                  <tr key={job.id} className="border-b last:border-0">
                    <td className="p-4 font-medium text-text-dark">{job.appName}</td>
                    <td className="p-4 text-text-light">{job.version}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${isActive ? 'animate-spin' : ''}`} />
                        {job.status}
                        {job.progress > 0 && job.progress < 100 && ` (${String(job.progress)}%)`}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-text-light">
                      {job.startedAt ? formatTime(job.startedAt) : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {(job.status === 'queued' || job.status === 'building') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(job.id)}
                          disabled={isCanceling}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRetry(job.id)}
                          disabled={isRetrying}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

interface WorkersCardProps {
  workers: BuildWorker[]
}

function WorkersCard({ workers }: WorkersCardProps) {
  const statusColors: Record<BuildWorker['status'], string> = {
    idle: 'bg-pastel-green',
    busy: 'bg-pastel-yellow',
    offline: 'bg-gray-300',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="w-5 h-5" />
          Workers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {workers.length === 0 ? (
          <p className="text-text-light text-center py-4">No workers registered</p>
        ) : (
          <div className="space-y-3">
            {workers.map((worker) => (
              <div key={worker.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${statusColors[worker.status]}`} />
                  <div>
                    <p className="font-medium text-text-dark text-sm">{worker.id}</p>
                    <p className="text-xs text-text-light">
                      {String(worker.jobsCompleted)} jobs completed
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {worker.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BuildQueueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
