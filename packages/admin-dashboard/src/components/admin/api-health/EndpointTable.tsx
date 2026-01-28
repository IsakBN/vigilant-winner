'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@bundlenudge/shared-ui'
import type { ApiEndpointStats } from '@/lib/api/types/admin'

interface EndpointTableProps {
  endpoints: ApiEndpointStats[] | undefined
  isLoading: boolean
}

/**
 * Displays endpoint health statistics in a sortable table
 */
export function EndpointTable({ endpoints, isLoading }: EndpointTableProps) {
  if (isLoading) {
    return <EndpointTableSkeleton />
  }

  const sortedEndpoints = [...(endpoints ?? [])].sort((a, b) => {
    // Sort by error rate desc, then latency desc
    if (b.errorRate !== a.errorRate) return b.errorRate - a.errorRate
    return b.p95Latency - a.p95Latency
  })

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-text-dark">
          Endpoint Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border-light bg-background-subtle">
                <TableHead className="font-medium text-text-light">Endpoint</TableHead>
                <TableHead className="font-medium text-text-light text-right">Requests</TableHead>
                <TableHead className="font-medium text-text-light text-right">Avg</TableHead>
                <TableHead className="font-medium text-text-light text-right">P95</TableHead>
                <TableHead className="font-medium text-text-light text-right">Errors</TableHead>
                <TableHead className="font-medium text-text-light text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEndpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-text-light">
                    No endpoint data available
                  </TableCell>
                </TableRow>
              ) : (
                sortedEndpoints.map((endpoint, idx) => (
                  <EndpointRow key={idx} endpoint={endpoint} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

interface EndpointRowProps {
  endpoint: ApiEndpointStats
}

function EndpointRow({ endpoint }: EndpointRowProps) {
  const status = getEndpointStatus(endpoint)

  return (
    <TableRow className="hover:bg-background-subtle/50">
      <TableCell>
        <div className="flex items-center gap-2">
          <MethodBadge method={endpoint.method} />
          <span className="font-mono text-sm text-text-dark">{endpoint.path}</span>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm text-text-dark">
        {formatNumber(endpoint.requestCount)}
      </TableCell>
      <TableCell className="text-right text-sm text-text-dark">
        {formatMs(endpoint.avgLatency)}
      </TableCell>
      <TableCell className={cn(
        'text-right text-sm font-medium',
        endpoint.p95Latency > 500 ? 'text-pastel-orange' : 'text-text-dark'
      )}>
        {formatMs(endpoint.p95Latency)}
      </TableCell>
      <TableCell className={cn(
        'text-right text-sm font-medium',
        endpoint.errorRate > 2 ? 'text-red-500' : 'text-text-dark'
      )}>
        {endpoint.errorRate.toFixed(2)}%
        <span className="text-xs text-text-light ml-1">
          ({String(endpoint.errorCount)})
        </span>
      </TableCell>
      <TableCell className="text-center">
        <StatusBadge status={status} />
      </TableCell>
    </TableRow>
  )
}

interface MethodBadgeProps {
  method: string
}

function MethodBadge({ method }: MethodBadgeProps) {
  const colors: Record<string, string> = {
    GET: 'bg-pastel-blue/10 text-pastel-blue border-pastel-blue/20',
    POST: 'bg-pastel-green/10 text-pastel-green border-pastel-green/20',
    PUT: 'bg-pastel-orange/10 text-pastel-orange border-pastel-orange/20',
    PATCH: 'bg-purple-100 text-purple-700 border-purple-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <Badge variant="outline" className={cn('text-xs font-mono', colors[method] ?? 'bg-muted')}>
      {method}
    </Badge>
  )
}

type EndpointStatus = 'good' | 'warning' | 'critical'

interface StatusBadgeProps {
  status: EndpointStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    good: { label: 'Good', className: 'bg-pastel-green/10 text-pastel-green border-pastel-green/20' },
    warning: { label: 'Warn', className: 'bg-pastel-orange/10 text-pastel-orange border-pastel-orange/20' },
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
  }

  return (
    <Badge variant="outline" className={cn('text-xs', config[status].className)}>
      {config[status].label}
    </Badge>
  )
}

function EndpointTableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border-light">
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function getEndpointStatus(endpoint: ApiEndpointStats): EndpointStatus {
  if (endpoint.errorRate > 5 || endpoint.p95Latency > 1000) return 'critical'
  if (endpoint.errorRate > 2 || endpoint.p95Latency > 500) return 'warning'
  return 'good'
}

function formatMs(ms: number): string {
  if (ms < 1) return '< 1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}
