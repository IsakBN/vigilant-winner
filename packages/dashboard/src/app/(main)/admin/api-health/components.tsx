'use client'

/**
 * API Health Page Components
 *
 * Helper components for the API Health admin page.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, ShieldOff } from 'lucide-react'
import type { ApiEndpointStats, ApiRecentError } from '@/lib/api'

export function EndpointsTable({ endpoints }: { endpoints: ApiEndpointStats[] }) {
  const sortedEndpoints = [...endpoints].sort((a, b) => b.requestCount - a.requestCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Endpoint Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-sm font-medium text-text-light">Endpoint</th>
              <th className="text-right p-4 text-sm font-medium text-text-light">Requests</th>
              <th className="text-right p-4 text-sm font-medium text-text-light">Avg Latency</th>
              <th className="text-right p-4 text-sm font-medium text-text-light">P95</th>
              <th className="text-right p-4 text-sm font-medium text-text-light">Error Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedEndpoints.map((endpoint, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {endpoint.method}
                    </Badge>
                    <span className="text-sm font-mono text-text-dark">{endpoint.path}</span>
                  </div>
                </td>
                <td className="p-4 text-right text-sm text-text-light">
                  {endpoint.requestCount.toLocaleString()}
                </td>
                <td className="p-4 text-right">
                  <LatencyBadge value={endpoint.avgLatency} />
                </td>
                <td className="p-4 text-right">
                  <LatencyBadge value={endpoint.p95Latency} />
                </td>
                <td className="p-4 text-right">
                  <ErrorRateBadge rate={endpoint.errorRate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function LatencyBadge({ value }: { value: number }) {
  const color = value > 500 ? 'text-destructive' : value > 200 ? 'text-pastel-yellow' : 'text-pastel-green'
  return <span className={`text-sm font-mono ${color}`}>{value.toFixed(0)}ms</span>
}

function ErrorRateBadge({ rate }: { rate: number }) {
  const className =
    rate > 5
      ? 'bg-destructive/20 text-destructive'
      : rate > 1
        ? 'bg-pastel-yellow/20 text-pastel-yellow'
        : 'bg-pastel-green/20 text-pastel-green'
  return <Badge variant="outline" className={className}>{rate.toFixed(1)}%</Badge>
}

export function RateLimitCard({ data }: { data: { totalBlocked: number; byEndpoint: Record<string, number> } }) {
  const endpoints = Object.entries(data.byEndpoint).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldOff className="w-5 h-5" />
          Rate Limiting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-text-dark mb-4">
          {data.totalBlocked.toLocaleString()}
          <span className="text-sm font-normal text-text-light ml-2">requests blocked</span>
        </p>
        {endpoints.length > 0 ? (
          <div className="space-y-2">
            {endpoints.map(([endpoint, count]) => (
              <div key={endpoint} className="flex items-center justify-between text-sm">
                <span className="font-mono text-text-light truncate">{endpoint}</span>
                <span className="text-text-dark font-medium">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-light text-sm">No blocked requests</p>
        )}
      </CardContent>
    </Card>
  )
}

export function RecentErrorsCard({ errors }: { errors: ApiRecentError[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Recent Errors
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <p className="text-text-light text-sm py-4 text-center">No recent errors</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {errors.slice(0, 10).map((err) => (
              <div key={err.id} className="p-3 bg-destructive/5 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-destructive/20 text-destructive">
                    {err.status}
                  </Badge>
                  <span className="text-xs text-text-light">{formatTime(err.timestamp)}</span>
                </div>
                <p className="text-sm font-mono text-text-dark">{err.endpoint}</p>
                <p className="text-xs text-text-light mt-1 truncate">{err.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ApiHealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
