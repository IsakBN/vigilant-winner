'use client'

import { Badge } from '@bundlenudge/shared-ui'
import { TableCell, TableRow } from '@bundlenudge/shared-ui'
import type { LogEntry as LogEntryType } from '@/lib/api/types/admin'

interface LogEntryProps {
  log: LogEntryType
  onClick?: (log: LogEntryType) => void
}

const LEVEL_STYLES: Record<string, string> = {
  error: 'bg-red-100 text-red-800 border-red-200',
  warn: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  debug: 'bg-gray-100 text-gray-800 border-gray-200',
}

const SERVICE_STYLES: Record<string, string> = {
  api: 'bg-purple-100 text-purple-800 border-purple-200',
  worker: 'bg-orange-100 text-orange-800 border-orange-200',
  dashboard: 'bg-green-100 text-green-800 border-green-200',
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata)
  if (entries.length === 0) return '-'
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ')
}

export function LogEntry({ log, onClick }: LogEntryProps) {
  const levelStyle = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info
  const serviceStyle = SERVICE_STYLES[log.service] ?? SERVICE_STYLES.api

  return (
    <TableRow
      className={onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
      onClick={() => onClick?.(log)}
    >
      <TableCell className="whitespace-nowrap text-sm text-gray-500">
        {formatTimestamp(log.timestamp)}
      </TableCell>
      <TableCell>
        <Badge className={levelStyle}>{log.level.toUpperCase()}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={serviceStyle}>{log.service}</Badge>
      </TableCell>
      <TableCell className="max-w-md">
        <span className="text-sm text-gray-900 line-clamp-2">{log.message}</span>
      </TableCell>
      <TableCell className="max-w-xs">
        <span className="text-sm text-gray-500 truncate block">
          {formatMetadata(log.metadata)}
        </span>
      </TableCell>
    </TableRow>
  )
}
