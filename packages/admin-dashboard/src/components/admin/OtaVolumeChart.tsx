'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@bundlenudge/shared-ui'

export interface OtaMetricsHourlyBreakdown {
  hour: string
  success: number
  failed: number
}

interface OtaVolumeChartProps {
  hourlyData: OtaMetricsHourlyBreakdown[] | undefined
  isLoading: boolean
}

/**
 * 24-hour OTA volume bar chart
 */
export function OtaVolumeChart({ hourlyData, isLoading }: OtaVolumeChartProps) {
  if (isLoading) {
    return <OtaVolumeChartSkeleton />
  }

  const data = hourlyData ?? []
  const maxValue = Math.max(...data.map((d) => d.success + d.failed), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-dark">
          24-Hour OTA Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-text-light">
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart area */}
            <div className="flex items-end gap-1 h-32">
              {data.map((entry) => {
                const total = entry.success + entry.failed
                const heightPercent = (total / maxValue) * 100
                const failedPercent = total > 0 ? (entry.failed / total) * 100 : 0

                return (
                  <div
                    key={entry.hour}
                    className="flex-1 flex flex-col justify-end h-full group relative"
                  >
                    <div
                      className="w-full bg-pastel-green rounded-t relative overflow-hidden"
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
                      <div className="bg-text-dark text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {formatHour(entry.hour)}: {total} ({entry.failed} failed)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* X-axis labels (show every 6 hours) */}
            <div className="flex justify-between text-xs text-text-light">
              {data
                .filter((_, i) => i % 6 === 0)
                .map((entry) => (
                  <span key={entry.hour}>{formatHour(entry.hour)}</span>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-pastel-green rounded" />
                <span className="text-text-light">Successful</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-text-light">Failed</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OtaVolumeChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
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

function formatHour(hour: string): string {
  const h = parseInt(hour, 10)
  if (isNaN(h)) return hour
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${String(h)}am` : `${String(h - 12)}pm`
}
