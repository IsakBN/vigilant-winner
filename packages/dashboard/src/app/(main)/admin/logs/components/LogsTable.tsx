'use client'

/**
 * Logs Table Component
 *
 * Displays system logs in a scrollable list with level and service badges.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@/components/ui'
import { AlertCircle, AlertTriangle, Info, Bug } from 'lucide-react'
import type { LogLevel, LogService, LogEntry } from '@/lib/api'

const LEVEL_CONFIG: Record<LogLevel, { icon: typeof Info; color: string }> = {
  error: { icon: AlertCircle, color: 'bg-destructive/20 text-destructive' },
  warn: { icon: AlertTriangle, color: 'bg-pastel-yellow/20 text-pastel-yellow' },
  info: { icon: Info, color: 'bg-pastel-blue/20 text-pastel-blue' },
  debug: { icon: Bug, color: 'bg-gray-100 text-gray-600' },
}

const SERVICE_COLORS: Record<LogService, string> = {
  api: 'bg-pastel-purple/20 text-pastel-purple',
  worker: 'bg-pastel-green/20 text-pastel-green',
  dashboard: 'bg-pastel-blue/20 text-pastel-blue',
}

interface LogsTableProps {
  logs: LogEntry[]
  total: number
  hasMore: boolean
  onLoadMore: () => void
}

export function LogsTable({ logs, total, hasMore, onLoadMore }: LogsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Logs</CardTitle>
        <span className="text-sm text-text-light">{total.toLocaleString()} entries</span>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-text-light">No logs found</div>
        ) : (
          <>
            <div className="max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
            {hasMore && (
              <div className="p-4 border-t">
                <Button variant="outline" className="w-full" onClick={onLoadMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface LogRowProps {
  log: LogEntry
}

function LogRow({ log }: LogRowProps) {
  const config = LEVEL_CONFIG[log.level]
  const LevelIcon = config.icon
  const serviceColor = SERVICE_COLORS[log.service]
  const hasMetadata = Object.keys(log.metadata).length > 0

  return (
    <div className="flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50">
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={config.color}>
          <LevelIcon className="w-3 h-3 mr-1" />
          {log.level}
        </Badge>
        <Badge variant="outline" className={serviceColor}>
          {log.service}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-dark font-mono break-all">{log.message}</p>
        {hasMetadata && (
          <pre className="mt-1 text-xs text-text-light font-mono bg-muted p-2 rounded overflow-x-auto">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        )}
      </div>
      <span className="text-xs text-text-light shrink-0">{formatTime(log.timestamp)}</span>
    </div>
  )
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
