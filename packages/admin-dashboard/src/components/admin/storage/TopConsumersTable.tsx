'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bundlenudge/shared-ui'
import type { StorageAppMetrics } from '@/lib/api/types/admin'

interface TopConsumersTableProps {
  data: StorageAppMetrics[] | undefined
  isLoading: boolean
}

/**
 * Table showing top storage consumers by app
 */
export function TopConsumersTable({ data, isLoading }: TopConsumersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Storage Consumers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>App Name</TableHead>
              <TableHead className="text-right">Bundles</TableHead>
              <TableHead className="text-right">Storage</TableHead>
              <TableHead className="text-right">Avg Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No storage data available
                </TableCell>
              </TableRow>
            ) : (
              data.slice(0, 10).map((app, index) => (
                <TableRow key={app.appId}>
                  <TableCell>
                    <RankBadge rank={index + 1} />
                  </TableCell>
                  <TableCell className="font-medium">{app.appName}</TableCell>
                  <TableCell className="text-right">{app.bundleCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatBytes(app.bytes)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatBytes(app.bundleCount > 0 ? app.bytes / app.bundleCount : 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const colorClass = rank === 1
    ? 'bg-yellow-100 text-yellow-700'
    : rank === 2
    ? 'bg-gray-100 text-gray-700'
    : rank === 3
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-50 text-gray-500'

  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}>
      {rank}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
