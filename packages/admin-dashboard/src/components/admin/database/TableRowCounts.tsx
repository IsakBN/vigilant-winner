'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { DatabaseTable } from '@/lib/api/types/admin'

interface TableRowCountsProps {
  tables: DatabaseTable[] | undefined
  isLoading: boolean
}

/**
 * Table showing row counts and sizes for each database table
 */
export function TableRowCounts({ tables, isLoading }: TableRowCountsProps) {
  if (isLoading) {
    return <TableRowCountsSkeleton />
  }

  if (!tables || tables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No table data available.</p>
        </CardContent>
      </Card>
    )
  }

  const sortedTables = [...tables].sort((a, b) => b.rowCount - a.rowCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Name</TableHead>
              <TableHead className="text-right">Row Count</TableHead>
              <TableHead className="text-right">Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTables.map((table) => (
              <TableRow key={table.name}>
                <TableCell className="font-mono text-sm">{table.name}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(table.rowCount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatBytes(table.sizeBytes)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function TableRowCountsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

export { TableRowCountsSkeleton }
