'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Sparkline } from '@/components/dashboard/Sparkline'
import { cn } from '@/lib/utils'

type AppStatus = 'healthy' | 'warning' | 'critical' | 'setup_required'

export interface AppHealthData {
  id: string
  name: string
  status: AppStatus
  latestVersion: string | null
  lastUpdated: number | null
  devices: number
  successRate: number
  sparkline: number[]
}

export interface AppHealthTableProps {
  apps: AppHealthData[]
  accountId: string
  className?: string
}

const STATUS_CONFIG: Record<AppStatus, { label: string; dotClassName: string; textClassName: string }> = {
  healthy: {
    label: 'Live',
    dotClassName: 'bg-success',
    textClassName: 'text-success',
  },
  warning: {
    label: 'Warning',
    dotClassName: 'bg-warning',
    textClassName: 'text-warning',
  },
  critical: {
    label: 'Critical',
    dotClassName: 'bg-destructive',
    textClassName: 'text-destructive',
  },
  setup_required: {
    label: 'Setup Required',
    dotClassName: 'bg-neutral-400',
    textClassName: 'text-neutral-500',
  },
}

function formatDeviceCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return String(count)
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${String(days)}d ago`
  }
  if (hours > 0) {
    return `${String(hours)}h ago`
  }
  if (minutes > 0) {
    return `${String(minutes)}m ago`
  }
  return 'just now'
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 99) return 'text-success'
  if (rate >= 95) return 'text-warning'
  return 'text-destructive'
}

function getSparklineColor(status: AppStatus): 'success' | 'warning' | 'destructive' | 'neutral' {
  switch (status) {
    case 'healthy':
      return 'success'
    case 'warning':
      return 'warning'
    case 'critical':
      return 'destructive'
    default:
      return 'neutral'
  }
}

function StatusCell({ status }: { status: AppStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn('w-2 h-2 rounded-full', config.dotClassName)}
        aria-hidden="true"
      />
      <span className={cn('text-sm', config.textClassName)}>
        {config.label}
      </span>
    </div>
  )
}

function VersionCell({
  version,
  lastUpdated,
}: {
  version: string | null
  lastUpdated: number | null
}) {
  if (!version) {
    return <span className="text-neutral-400">-</span>
  }

  return (
    <div className="flex flex-col">
      <span className="font-mono text-sm text-neutral-900">{version}</span>
      {lastUpdated && (
        <span className="text-xs text-neutral-500">
          {getRelativeTime(lastUpdated)}
        </span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-neutral-900 mb-1">No apps yet</h3>
      <p className="text-sm text-neutral-500">
        Create your first app to start pushing updates.
      </p>
    </div>
  )
}

export function AppHealthTable({ apps, accountId, className }: AppHealthTableProps) {
  if (apps.length === 0) {
    return <EmptyState />
  }

  return (
    <div className={cn('w-full', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">App</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[120px]">Latest</TableHead>
            <TableHead className="w-[100px] text-right">Devices</TableHead>
            <TableHead className="w-[100px] text-right">Success</TableHead>
            <TableHead className="w-[100px] text-right">7D</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => (
            <TableRow key={app.id} className="group">
              <TableCell>
                <Link
                  href={`/dashboard/${accountId}/apps/${app.id}`}
                  className="font-medium text-neutral-900 hover:text-primary transition-colors"
                >
                  {app.name}
                </Link>
              </TableCell>
              <TableCell>
                <StatusCell status={app.status} />
              </TableCell>
              <TableCell>
                <VersionCell
                  version={app.latestVersion}
                  lastUpdated={app.lastUpdated}
                />
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-sm text-neutral-700">
                  {formatDeviceCount(app.devices)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {app.status === 'setup_required' ? (
                  <span className="text-neutral-400">-</span>
                ) : (
                  <span
                    className={cn(
                      'font-mono text-sm',
                      getSuccessRateColor(app.successRate)
                    )}
                  >
                    {app.successRate.toFixed(1)}%
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <Sparkline
                    data={app.sparkline}
                    width={60}
                    height={20}
                    color={getSparklineColor(app.status)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { AppHealthTable as default }
