'use client'

import { Server, CheckCircle, Loader2, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@bundlenudge/shared-ui'
import type { BuildWorker, WorkerStatus } from '@/lib/api/types/admin'

interface WorkersStatusProps {
  workers: BuildWorker[] | undefined
  isLoading: boolean
}

const STATUS_CONFIG: Record<WorkerStatus, { icon: typeof Server; color: string; bg: string }> = {
  idle: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  busy: {
    icon: Loader2,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  offline: {
    icon: WifiOff,
    color: 'text-gray-400',
    bg: 'bg-gray-100',
  },
}

/**
 * Card showing build worker status
 */
export function WorkersStatus({ workers, isLoading }: WorkersStatusProps) {
  const idleCount = workers?.filter((w) => w.status === 'idle').length ?? 0
  const busyCount = workers?.filter((w) => w.status === 'busy').length ?? 0
  const offlineCount = workers?.filter((w) => w.status === 'offline').length ?? 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Server className="h-4 w-4" />
          Build Workers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <Badge className="bg-green-100 text-green-700 border-0">
                {idleCount} Idle
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 border-0">
                {busyCount} Busy
              </Badge>
              <Badge className="bg-gray-100 text-gray-500 border-0">
                {offlineCount} Offline
              </Badge>
            </div>

            {workers && workers.length > 0 && (
              <div className="space-y-2">
                {workers.map((worker) => {
                  const config = STATUS_CONFIG[worker.status]
                  const IconComponent = config.icon
                  return (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${config.bg}`}>
                          <IconComponent
                            className={`h-3 w-3 ${config.color} ${
                              worker.status === 'busy' ? 'animate-spin' : ''
                            }`}
                          />
                        </div>
                        <span className="text-sm font-medium">{worker.id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {worker.currentJob && (
                          <span className="text-xs">
                            Job: {worker.currentJob.slice(0, 8)}...
                          </span>
                        )}
                        <span>{worker.jobsCompleted} completed</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {(!workers || workers.length === 0) && (
              <p className="text-sm text-muted-foreground">No workers registered</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
