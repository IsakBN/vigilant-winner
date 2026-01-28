'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'
import type { OtaMetricsHourlyBreakdown } from '@/lib/api/types/admin'

interface UpdateTrendChartProps {
  hourlyData: OtaMetricsHourlyBreakdown[] | undefined
  isLoading: boolean
  period: '24h' | '7d' | '30d'
}

/**
 * Update trend bar chart showing success/failure over time
 */
export function UpdateTrendChart({ hourlyData, isLoading, period }: UpdateTrendChartProps) {
  if (isLoading) {
    return <TrendChartSkeleton />
  }

  const data = hourlyData ?? []
  const maxValue = Math.max(...data.map((d) => d.success + d.failed), 1)
  const displayData = getDisplayData(data, period)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-dark">
          Update Trend ({periodLabel(period)})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayData.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No trend data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart area */}
            <div className="flex items-end gap-1 h-40">
              {displayData.map((entry, index) => {
                const total = entry.success + entry.failed
                const heightPercent = (total / maxValue) * 100
                const failedPercent = total > 0 ? (entry.failed / total) * 100 : 0

                return (
                  <div
                    key={`${entry.hour}-${String(index)}`}
                    className="flex-1 flex flex-col justify-end h-full group relative"
                  >
                    <div
                      className="w-full bg-pastel-green rounded-t relative overflow-hidden transition-all hover:opacity-80"
                      style={{ height: `${String(heightPercent)}%`, minHeight: total > 0 ? '4px' : 0 }}
                    >
                      {failedPercent > 0 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-red-400"
                          style={{ height: `${String(failedPercent)}%` }}
                        />
                      )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="bg-text-dark text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                        {formatHour(entry.hour)}: {total} ({entry.failed} failed)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              {getAxisLabels(displayData, period).map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-pastel-green rounded" />
                <span className="text-muted-foreground">Successful</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-muted-foreground">Failed</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TrendChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-40">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${String(Math.random() * 80 + 20)}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getDisplayData(
  data: OtaMetricsHourlyBreakdown[],
  period: '24h' | '7d' | '30d'
): OtaMetricsHourlyBreakdown[] {
  if (period === '24h') {
    return data.slice(-24)
  }
  if (period === '7d') {
    return data.slice(-168)
  }
  return data.slice(-720)
}

function getAxisLabels(data: OtaMetricsHourlyBreakdown[], period: '24h' | '7d' | '30d'): string[] {
  if (data.length === 0) return []

  const step = period === '24h' ? 6 : period === '7d' ? 24 : 120
  const labels: string[] = []

  for (let i = 0; i < data.length; i += step) {
    if (data[i]) {
      labels.push(formatHour(data[i].hour))
    }
  }

  return labels.slice(0, 5)
}

function periodLabel(period: '24h' | '7d' | '30d'): string {
  switch (period) {
    case '24h': return 'Last 24 Hours'
    case '7d': return 'Last 7 Days'
    case '30d': return 'Last 30 Days'
  }
}

function formatHour(hour: string): string {
  const h = parseInt(hour, 10)
  if (isNaN(h)) return hour
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${String(h)}am` : `${String(h - 12)}pm`
}
