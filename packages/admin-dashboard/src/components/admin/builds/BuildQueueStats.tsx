'use client'

import { Clock, Play, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, Skeleton } from '@bundlenudge/shared-ui'
import type { BuildQueueStats as BuildQueueStatsType } from '@/lib/api/types/admin'

interface BuildQueueStatsProps {
  stats: BuildQueueStatsType | undefined
  isLoading: boolean
}

/**
 * Stats cards showing queue overview metrics
 */
export function BuildQueueStats({ stats, isLoading }: BuildQueueStatsProps) {
  const cards = [
    {
      label: 'Pending',
      value: stats?.queueDepth ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Running',
      value: stats?.activeJobs ?? 0,
      icon: Play,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Completed Today',
      value: stats?.completedToday ?? 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Failed Today',
      value: stats?.failedToday ?? 0,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
