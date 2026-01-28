'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockReleases, mockReleaseStats } from '../mockData'

/**
 * Format large device counts for display
 */
function formatDeviceCount(count: number | null | undefined): string {
  if (count === null || count === undefined) {
    return '-'
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`
  }
  return String(count)
}

/**
 * ReleasesPreview
 *
 * Mock releases table shown in the onboarding preview modal.
 * Demonstrates what the releases tab looks like with data.
 */
export function ReleasesPreview() {
  return (
    <div className="space-y-4">
      {/* Releases Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Version</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rollout</TableHead>
              <TableHead className="text-right">Devices</TableHead>
              <TableHead className="text-right">Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockReleases.slice(0, 4).map((release) => {
              const stats =
                mockReleaseStats[release.id as keyof typeof mockReleaseStats]
              const activeDevices = stats?.applied

              return (
                <TableRow key={release.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-medium">
                      {release.version}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {release.channel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={release.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all"
                          style={{ width: `${String(release.rollout_percentage)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {release.rollout_percentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatDeviceCount(activeDevices)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <HealthIndicator crashFreeRate={99.7} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={5} />
        <StatCard label="Rolling" value={1} highlight="success" />
        <StatCard label="Complete" value={4} />
        <StatCard label="Failed" value={0} muted />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    rolling: 'Rolling',
    complete: 'Complete',
    paused: 'Paused',
    failed: 'Failed',
    pending: 'Pending',
    rolled_back: 'Rolled Back',
  }

  if (status === 'rolling') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {labels[status] || status}
      </span>
    )
  }

  if (status === 'complete') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-muted text-muted-foreground">
        {labels[status] || status}
      </span>
    )
  }

  return (
    <Badge variant="outline">{labels[status] || status}</Badge>
  )
}

function HealthIndicator({ crashFreeRate }: { crashFreeRate: number }) {
  const isHealthy = crashFreeRate >= 99
  return (
    <span
      className={`text-xs font-mono ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
    >
      {crashFreeRate.toFixed(1)}%
    </span>
  )
}

function StatCard({
  label,
  value,
  highlight,
  muted,
}: {
  label: string
  value: number
  highlight?: 'success' | 'destructive'
  muted?: boolean
}) {
  return (
    <div className="bg-background rounded-lg border p-3">
      <div
        className={`text-xl font-semibold ${
          highlight === 'success'
            ? 'text-green-600 dark:text-green-400'
            : highlight === 'destructive'
              ? 'text-red-600 dark:text-red-400'
              : muted
                ? 'text-muted-foreground'
                : 'text-foreground'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
