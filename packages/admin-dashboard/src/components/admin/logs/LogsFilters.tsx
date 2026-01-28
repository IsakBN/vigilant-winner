'use client'

import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bundlenudge/shared-ui'
import type { LogLevel, LogService, ListLogsParams } from '@/lib/api/types/admin'

interface LogsFiltersProps {
  filters: ListLogsParams
  onFiltersChange: (filters: ListLogsParams) => void
  onExport: () => void
  isExporting: boolean
}

const LOG_LEVELS: { value: LogLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
]

const LOG_SERVICES: { value: LogService | 'all'; label: string }[] = [
  { value: 'all', label: 'All Services' },
  { value: 'api', label: 'API' },
  { value: 'worker', label: 'Worker' },
  { value: 'dashboard', label: 'Dashboard' },
]

export function LogsFilters({ filters, onFiltersChange, onExport, isExporting }: LogsFiltersProps) {
  const handleLevelChange = (value: string) => {
    onFiltersChange({
      ...filters,
      level: value === 'all' ? undefined : (value as LogLevel),
      page: 1,
    })
  }

  const handleServiceChange = (value: string) => {
    onFiltersChange({
      ...filters,
      service: value === 'all' ? undefined : (value as LogService),
      page: 1,
    })
  }

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
      page: 1,
    })
  }

  const handleStartDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      startTime: value ? new Date(value).getTime() : undefined,
      page: 1,
    })
  }

  const handleEndDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      endTime: value ? new Date(value).getTime() + 86400000 : undefined,
      page: 1,
    })
  }

  const formatDateForInput = (timestamp?: number): string => {
    if (!timestamp) return ''
    return new Date(timestamp).toISOString().split('T')[0] ?? ''
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filters.level ?? 'all'} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Log level" />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.service ?? 'all'} onValueChange={handleServiceChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            {LOG_SERVICES.map((service) => (
              <SelectItem key={service.value} value={service.value}>
                {service.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search logs..."
          value={filters.search ?? ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-48"
        />

        <Input
          type="date"
          value={formatDateForInput(filters.startTime)}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className="w-36"
        />

        <Input
          type="date"
          value={formatDateForInput(filters.endTime ? filters.endTime - 86400000 : undefined)}
          onChange={(e) => handleEndDateChange(e.target.value)}
          className="w-36"
        />

        <Button variant="outline" onClick={onExport} disabled={isExporting}>
          {isExporting ? 'Exporting...' : 'Export Logs'}
        </Button>
      </div>
    </div>
  )
}
