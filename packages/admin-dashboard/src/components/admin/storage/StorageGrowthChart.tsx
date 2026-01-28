'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { StorageGrowthEntry } from '@/lib/api/types/admin'

interface StorageGrowthChartProps {
  data: StorageGrowthEntry[] | undefined
  isLoading: boolean
}

/**
 * Simple bar chart showing storage growth over time
 */
export function StorageGrowthChart({ data, isLoading }: StorageGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Storage Growth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !data || data.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No growth data available
          </div>
        ) : (
          <GrowthBarChart data={data} />
        )}
      </CardContent>
    </Card>
  )
}

function GrowthBarChart({ data }: { data: StorageGrowthEntry[] }) {
  const maxBytes = Math.max(...data.map(d => d.totalBytes), 1)
  const recentData = data.slice(-14) // Show last 14 days

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-32">
        {recentData.map((entry, i) => {
          const height = (entry.totalBytes / maxBytes) * 100
          const date = new Date(entry.date)
          const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
              title={`${dayLabel}: ${formatBytes(entry.totalBytes)}`}
            >
              <div className="w-full flex flex-col-reverse h-28">
                <div
                  className="w-full bg-pastel-purple rounded-t transition-all group-hover:bg-pastel-purple/80"
                  style={{ height: `${Math.max(height, 3)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDateLabel(recentData[0]?.date)}</span>
        <span>{formatDateLabel(recentData[recentData.length - 1]?.date)}</span>
      </div>
    </div>
  )
}

function formatDateLabel(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
