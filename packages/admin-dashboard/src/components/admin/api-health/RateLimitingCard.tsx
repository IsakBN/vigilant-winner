'use client'

import { Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  cn,
} from '@bundlenudge/shared-ui'
import type { ApiHealthStats } from '@/lib/api/types/admin'

interface RateLimitingCardProps {
  data: ApiHealthStats['rateLimiting'] | undefined
  isLoading: boolean
}

/**
 * Displays rate limiting statistics
 */
export function RateLimitingCard({ data, isLoading }: RateLimitingCardProps) {
  if (isLoading) {
    return <RateLimitingSkeleton />
  }

  const endpointEntries = Object.entries(data?.byEndpoint ?? {})
  const sortedEntries = endpointEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-text-dark">
          Rate Limiting
        </CardTitle>
        <div className="p-2 rounded-lg bg-pastel-blue/10">
          <Shield className="w-5 h-5 text-pastel-blue" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-3xl font-bold text-text-dark">
            {formatNumber(data?.totalBlocked ?? 0)}
          </p>
          <p className="text-sm text-text-light">Requests blocked</p>
        </div>

        {sortedEntries.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-text-dark">Top blocked endpoints</p>
            {sortedEntries.map(([endpoint, count]) => (
              <EndpointBar key={endpoint} endpoint={endpoint} count={count} total={data?.totalBlocked ?? 1} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-light text-center py-4">
            No rate-limited requests in this period
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface EndpointBarProps {
  endpoint: string
  count: number
  total: number
}

function EndpointBar({ endpoint, count, total }: EndpointBarProps) {
  const percentage = (count / total) * 100

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-mono text-text-dark truncate max-w-[200px]">{endpoint}</span>
        <span className="text-text-light ml-2">{formatNumber(count)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            percentage > 50 ? 'bg-pastel-orange' : 'bg-pastel-blue'
          )}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  )
}

function RateLimitingSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Skeleton className="h-9 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-40 mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between mb-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}
