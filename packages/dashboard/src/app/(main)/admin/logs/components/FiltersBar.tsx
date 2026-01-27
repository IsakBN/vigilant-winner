'use client'

/**
 * Logs Filters Bar Component
 *
 * Search input and dropdowns for filtering logs by level and service.
 */

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { Search } from 'lucide-react'
import type { LogLevel, LogService } from '@/lib/api'

interface FiltersBarProps {
  search: string
  onSearchChange: (v: string) => void
  level?: LogLevel
  onLevelChange: (v: LogLevel | undefined) => void
  service?: LogService
  onServiceChange: (v: LogService | undefined) => void
}

export function FiltersBar({
  search,
  onSearchChange,
  level,
  onLevelChange,
  service,
  onServiceChange,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
        <Input
          placeholder="Search logs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={level ?? 'all'}
        onValueChange={(v) => onLevelChange(v === 'all' ? undefined : (v as LogLevel))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="error">Error</SelectItem>
          <SelectItem value="warn">Warning</SelectItem>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="debug">Debug</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={service ?? 'all'}
        onValueChange={(v) => onServiceChange(v === 'all' ? undefined : (v as LogService))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Service" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Services</SelectItem>
          <SelectItem value="api">API</SelectItem>
          <SelectItem value="worker">Worker</SelectItem>
          <SelectItem value="dashboard">Dashboard</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
