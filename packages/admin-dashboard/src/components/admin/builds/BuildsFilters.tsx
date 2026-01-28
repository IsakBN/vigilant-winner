'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bundlenudge/shared-ui'
import type { BuildJobStatus } from '@/lib/api/types/admin'

type StatusFilter = BuildJobStatus | 'all'

interface BuildsFiltersProps {
  statusFilter: StatusFilter
  onStatusChange: (status: StatusFilter) => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'building', label: 'Building' },
  { value: 'uploading', label: 'Uploading' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

/**
 * Filter controls for the builds table
 */
export function BuildsFilters({ statusFilter, onStatusChange }: BuildsFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by status:</span>
        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusChange(value as StatusFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export type { StatusFilter }
