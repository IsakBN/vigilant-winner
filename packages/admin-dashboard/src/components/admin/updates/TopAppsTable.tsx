'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
} from '@bundlenudge/shared-ui'
import type { OtaMetricsAppBreakdown } from '@/lib/api/types/admin'

interface TopAppsTableProps {
  apps: OtaMetricsAppBreakdown[] | undefined
  isLoading: boolean
}

/**
 * Top apps by OTA downloads table
 */
export function TopAppsTable({ apps, isLoading }: TopAppsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Apps by Downloads</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <TopAppsTableSkeleton />
        ) : !apps || apps.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No app data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    App
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updates
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failures
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apps.slice(0, 10).map((app) => {
                  const failureRate = app.updates > 0
                    ? (app.failures / app.updates) * 100
                    : 0
                  return (
                    <tr key={app.appId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{app.appName}</div>
                        <div className="text-xs text-gray-500">{app.appId.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatNumber(app.updates)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {app.failures > 0 ? (
                          <span className="text-red-600">{formatNumber(app.failures)}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          className={
                            failureRate > 5
                              ? 'bg-red-100 text-red-700'
                              : failureRate > 2
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }
                        >
                          {failureRate > 5 ? 'Critical' : failureRate > 2 ? 'Warning' : 'Healthy'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TopAppsTableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
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
