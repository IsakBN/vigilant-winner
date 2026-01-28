'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { DatabaseTable } from '@/lib/api/types/admin'

interface TableGrowthChartProps {
  tables: DatabaseTable[] | undefined
  isLoading: boolean
}

/**
 * Visual representation of table sizes as a horizontal bar chart
 */
export function TableGrowthChart({ tables, isLoading }: TableGrowthChartProps) {
  if (isLoading) {
    return <TableGrowthChartSkeleton />
  }

  if (!tables || tables.length === 0) {
    return null
  }

  const sortedBySize = [...tables]
    .sort((a, b) => b.rowCount - a.rowCount)
    .slice(0, 8)
  const maxRowCount = Math.max(...sortedBySize.map((t) => t.rowCount))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Size Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedBySize.map((table) => {
            const percentage = maxRowCount > 0 ? (table.rowCount / maxRowCount) * 100 : 0
            return (
              <div key={table.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-muted-foreground">{table.name}</span>
                  <span className="font-medium">{formatNumber(table.rowCount)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pastel-blue rounded-full transition-all"
                    style={{ width: `${String(percentage)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function TableGrowthChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
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

export { TableGrowthChartSkeleton }
