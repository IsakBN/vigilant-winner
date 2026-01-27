'use client'

/**
 * Admin Database Stats Page
 *
 * Monitor database metrics, table sizes, and slow queries.
 */

import { useDatabaseStats } from '@/hooks/useAdminOps'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { Database, HardDrive, Clock, Zap, RefreshCw, AlertTriangle } from 'lucide-react'
import type { DatabaseStats } from '@/lib/api'

export default function AdminDatabasePage() {
  const { data, isLoading, error, refetch, isFetching } = useDatabaseStats()

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Failed to load database stats. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={() => void refetch()} isRefreshing={isFetching} />
      {isLoading ? <DatabaseSkeleton /> : data ? <DatabaseContent data={data} /> : null}
    </div>
  )
}

function DatabaseContent({ data }: { data: DatabaseStats }) {
  return (
    <>
      <StatsRow data={data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TablesCard tables={data.tables} />
        <SlowQueriesCard queries={data.slowQueries} />
      </div>
    </>
  )
}

function PageHeader({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Database</h1>
        <p className="text-text-light mt-1">Monitor database performance and metrics</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  )
}

function StatsRow({ data }: { data: DatabaseStats }) {
  const totalRows = data.tables.reduce((sum, t) => sum + t.rowCount, 0)
  const stats = [
    { label: 'Total Size', value: formatBytes(data.totalSize), icon: HardDrive, color: 'text-pastel-blue' },
    { label: 'Total Rows', value: totalRows.toLocaleString(), icon: Database, color: 'text-pastel-green' },
    { label: 'Tables', value: String(data.tables.length), icon: Database, color: 'text-pastel-purple' },
    { label: 'Avg Query Time', value: `${data.queryMetrics.avgQueryTime.toFixed(0)}ms`, icon: Clock, color: 'text-pastel-yellow' },
    { label: 'Queries/min', value: String(data.queryMetrics.queriesPerMinute), icon: Zap, color: 'text-pastel-green' },
    {
      label: 'Slow Queries',
      value: String(data.queryMetrics.slowQueries),
      icon: AlertTriangle,
      color: data.queryMetrics.slowQueries > 0 ? 'text-destructive' : 'text-text-light',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div>
                <p className="text-xl font-bold text-text-dark">{stat.value}</p>
                <p className="text-xs text-text-light">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface TablesCardProps {
  tables: Array<{ name: string; rowCount: number; sizeBytes: number }>
}

function TablesCard({ tables }: TablesCardProps) {
  const sortedTables = [...tables].sort((a, b) => b.sizeBytes - a.sizeBytes)
  const totalSize = tables.reduce((sum, t) => sum + t.sizeBytes, 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tables</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTables.length === 0 ? (
          <p className="text-text-light text-center py-8">No tables found</p>
        ) : (
          <div className="space-y-3">
            {sortedTables.map((table) => {
              const percentage = (table.sizeBytes / totalSize) * 100
              return (
                <div key={table.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-text-dark">{table.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-light">{table.rowCount.toLocaleString()} rows</span>
                      <Badge variant="outline">{formatBytes(table.sizeBytes)}</Badge>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-pastel-blue rounded-full" style={{ width: `${String(Math.max(percentage, 1))}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SlowQueriesCardProps {
  queries: Array<{ query: string; avgTime: number; count: number }>
}

function SlowQueriesCard({ queries }: SlowQueriesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-pastel-yellow" />
          Slow Queries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queries.length === 0 ? (
          <p className="text-text-light text-center py-8">No slow queries detected</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {queries.map((q, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-pastel-yellow/20 text-pastel-yellow">
                    {q.avgTime.toFixed(0)}ms avg
                  </Badge>
                  <span className="text-xs text-text-light">{q.count} executions</span>
                </div>
                <pre className="text-xs font-mono text-text-dark whitespace-pre-wrap break-all">
                  {q.query.length > 200 ? q.query.slice(0, 200) + '...' : q.query}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DatabaseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${String(parseFloat((bytes / Math.pow(k, i)).toFixed(1)))} ${sizes[i]}`
}
