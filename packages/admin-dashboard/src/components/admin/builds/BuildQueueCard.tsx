'use client'

import { Layers, Clock, CheckCircle2, XCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { BuildWorker } from '@/lib/api/types/admin'

interface BuildQueueCardProps {
  queueDepth: number
  activeJobs: number
  completedToday: number
  failedToday: number
  avgBuildTime: number
  workers: BuildWorker[]
  isLoading: boolean
}

/**
 * Build queue overview cards showing key stats
 */
export function BuildQueueCard({
  queueDepth,
  activeJobs,
  completedToday,
  failedToday,
  avgBuildTime,
  workers,
  isLoading,
}: BuildQueueCardProps) {
  if (isLoading) {
    return <BuildQueueCardSkeleton />
  }

  const busyWorkers = workers.filter((w) => w.status === 'busy').length
  const totalWorkers = workers.length

  const stats = [
    {
      title: 'Queue Depth',
      value: String(queueDepth),
      subtext: `${String(activeJobs)} active`,
      icon: Layers,
      color: queueDepth > 10 ? 'text-pastel-orange' : 'text-pastel-blue',
      bgColor: queueDepth > 10 ? 'bg-pastel-orange/10' : 'bg-pastel-blue/10',
    },
    {
      title: 'Workers',
      value: `${String(busyWorkers)}/${String(totalWorkers)}`,
      subtext: 'busy',
      icon: Clock,
      color: 'text-pastel-purple',
      bgColor: 'bg-pastel-purple/10',
    },
    {
      title: 'Completed Today',
      value: String(completedToday),
      subtext: formatMs(avgBuildTime) + ' avg',
      icon: CheckCircle2,
      color: 'text-pastel-green',
      bgColor: 'bg-pastel-green/10',
    },
    {
      title: 'Failed Today',
      value: String(failedToday),
      subtext: failedToday > 0 ? 'Check logs' : 'All good',
      icon: XCircle,
      color: failedToday > 0 ? 'text-red-500' : 'text-pastel-green',
      bgColor: failedToday > 0 ? 'bg-red-100' : 'bg-pastel-green/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subtext: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

function StatCard({ title, value, subtext, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-md ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text-dark">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  )
}

function BuildQueueCardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatMs(ms: number): string {
  if (ms < 1000) {
    return `${String(ms)}ms`
  }
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) {
    return `${String(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (remainingSeconds > 0) {
    return `${String(minutes)}m ${String(remainingSeconds)}s`
  }
  return `${String(minutes)}m`
}
