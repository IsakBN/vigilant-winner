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
  Badge,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { SlowQuery } from '@/lib/api/types/admin'

interface SlowQueriesTableProps {
  queries: SlowQuery[] | undefined
  isLoading: boolean
}

/**
 * Table showing recent slow queries for debugging
 */
export function SlowQueriesTable({ queries, isLoading }: SlowQueriesTableProps) {
  if (isLoading) {
    return <SlowQueriesTableSkeleton />
  }

  if (!queries || queries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Slow Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No slow queries detected.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slow Queries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Avg Time</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((query, index) => (
              <TableRow key={index}>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded max-w-md truncate block">
                    {truncateQuery(query.query)}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getTimeBadgeVariant(query.avgTime)}>
                    {String(query.avgTime)}ms
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatNumber(query.count)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SlowQueriesTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function truncateQuery(query: string, maxLength = 60): string {
  if (query.length <= maxLength) return query
  return `${query.slice(0, maxLength)}...`
}

function getTimeBadgeVariant(timeMs: number): 'default' | 'secondary' | 'destructive' {
  if (timeMs >= 1000) return 'destructive'
  if (timeMs >= 500) return 'secondary'
  return 'default'
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

export { SlowQueriesTableSkeleton }
