'use client'

import { Badge } from '@bundlenudge/shared-ui'
import type { BuildJobStatus } from '@/lib/api/types/admin'

interface BuildStatusBadgeProps {
  status: BuildJobStatus
}

const STATUS_CONFIG: Record<BuildJobStatus, { label: string; className: string }> = {
  queued: {
    label: 'Queued',
    className: 'bg-gray-100 text-gray-700 border-0',
  },
  building: {
    label: 'Building',
    className: 'bg-blue-100 text-blue-700 border-0',
  },
  uploading: {
    label: 'Uploading',
    className: 'bg-purple-100 text-purple-700 border-0',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 border-0',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 border-0',
  },
}

/**
 * Status badge for build jobs
 */
export function BuildStatusBadge({ status }: BuildStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return <Badge className={config.className}>{config.label}</Badge>
}
