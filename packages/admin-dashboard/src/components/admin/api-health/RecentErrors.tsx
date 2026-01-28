'use client'

import { AlertTriangle, ExternalLink } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  cn,
} from '@bundlenudge/shared-ui'
import { formatRelativeTime } from '@bundlenudge/shared-ui'
import type { ApiRecentError } from '@/lib/api/types/admin'

interface RecentErrorsProps {
  errors: ApiRecentError[] | undefined
  isLoading: boolean
}

/**
 * Displays recent API errors with timestamps and request IDs
 */
export function RecentErrors({ errors, isLoading }: RecentErrorsProps) {
  if (isLoading) {
    return <RecentErrorsSkeleton />
  }

  const sortedErrors = [...(errors ?? [])].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-text-dark">
          Recent Errors
        </CardTitle>
        <Badge variant="outline" className={cn(
          'text-xs',
          sortedErrors.length === 0
            ? 'bg-pastel-green/10 text-pastel-green border-pastel-green/20'
            : 'bg-red-100 text-red-700 border-red-200'
        )}>
          {sortedErrors.length} errors
        </Badge>
      </CardHeader>
      <CardContent>
        {sortedErrors.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {sortedErrors.slice(0, 10).map((error) => (
              <ErrorItem key={error.id} error={error} />
            ))}
            {sortedErrors.length > 10 && (
              <p className="text-xs text-text-light text-center pt-2">
                +{sortedErrors.length - 10} more errors
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ErrorItemProps {
  error: ApiRecentError
}

function ErrorItem({ error }: ErrorItemProps) {
  const statusConfig = getStatusConfig(error.status)

  return (
    <div className="p-3 rounded-lg bg-red-50/50 border border-red-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-1.5 rounded-full bg-red-100 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={statusConfig.className}>
                {error.status}
              </Badge>
              <span className="text-sm font-mono text-text-dark truncate">
                {error.endpoint}
              </span>
            </div>
            <p className="text-sm text-text-dark line-clamp-2">
              {error.message}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-light">
              <span>{formatRelativeTime(error.timestamp)}</span>
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                <span className="font-mono">{truncateRequestId(error.requestId)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="p-3 rounded-full bg-pastel-green/10 mb-3">
        <AlertTriangle className="w-6 h-6 text-pastel-green" />
      </div>
      <p className="text-sm font-medium text-text-dark">No recent errors</p>
      <p className="text-xs text-text-light mt-1">All API endpoints are healthy</p>
    </div>
  )
}

function RecentErrorsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function getStatusConfig(status: number): { className: string } {
  if (status >= 500) {
    return { className: 'bg-red-100 text-red-700 border-red-200' }
  }
  if (status >= 400) {
    return { className: 'bg-pastel-orange/10 text-pastel-orange border-pastel-orange/20' }
  }
  return { className: 'bg-muted text-text-light' }
}

function truncateRequestId(requestId: string): string {
  if (requestId.length <= 12) return requestId
  return `${requestId.slice(0, 8)}...`
}
