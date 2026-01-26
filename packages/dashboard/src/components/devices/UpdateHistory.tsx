'use client'

/**
 * UpdateHistory Component
 *
 * Displays a list of update events for a device.
 */

import {
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { DeviceUpdateEvent } from '@/lib/api'

// =============================================================================
// Helpers
// =============================================================================

function getStatusIcon(status: DeviceUpdateEvent['status']) {
  switch (status) {
    case 'installed':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'downloading':
      return <Download className="w-4 h-4 text-blue-500" />
    case 'installing':
      return <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
    default:
      return <Clock className="w-4 h-4 text-neutral-400" />
  }
}

function getStatusBadge(status: DeviceUpdateEvent['status']) {
  const variants: Record<string, string> = {
    installed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    downloading: 'bg-blue-100 text-blue-800',
    installing: 'bg-amber-100 text-amber-800',
    checking: 'bg-neutral-100 text-neutral-800',
  }

  return (
    <Badge variant="secondary" className={cn('text-xs capitalize', variants[status])}>
      {status}
    </Badge>
  )
}

function formatEventTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// =============================================================================
// Update History Item
// =============================================================================

interface UpdateHistoryItemProps {
  event: DeviceUpdateEvent
}

function UpdateHistoryItem({ event }: UpdateHistoryItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="mt-0.5">{getStatusIcon(event.status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-neutral-900">
            v{event.releaseVersion}
          </span>
          {getStatusBadge(event.status)}
        </div>
        <p className="text-xs text-neutral-500">
          {formatEventTime(event.createdAt)}
        </p>
        {event.errorMessage && (
          <p className="text-xs text-red-500 mt-1">{event.errorMessage}</p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

interface UpdateHistoryProps {
  events: DeviceUpdateEvent[]
}

export function UpdateHistory({ events }: UpdateHistoryProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 text-center py-4">
            No update history available for this device.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Update History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-y-auto">
          {events.map((event) => (
            <UpdateHistoryItem key={event.id} event={event} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
