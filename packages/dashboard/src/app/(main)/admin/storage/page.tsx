'use client'

/**
 * Admin Storage Metrics Page
 *
 * Monitor R2 storage usage, bundle counts, and storage growth.
 */

import { useStorageMetrics, useCleanupOrphanedBundles } from '@/hooks/useAdminOps'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { HardDrive, Package, TrendingUp, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import type { StorageMetrics, StorageAppMetrics, StorageLargestBundle } from '@/lib/api'

export default function AdminStoragePage() {
  const { data, isLoading, error, refetch, isFetching } = useStorageMetrics()
  const cleanup = useCleanupOrphanedBundles()

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Failed to load storage metrics. Please try again.</div>
      </div>
    )
  }

  const handleCleanup = () => {
    if (confirm('Remove all orphaned bundles? This cannot be undone.')) {
      cleanup.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        onRefresh={() => void refetch()}
        isRefreshing={isFetching}
        orphanedCount={data?.orphanedBundles ?? 0}
        onCleanup={handleCleanup}
        isCleaning={cleanup.isPending}
      />
      {isLoading ? <StorageSkeleton /> : data ? <StorageContent data={data} /> : null}
    </div>
  )
}

function StorageContent({ data }: { data: StorageMetrics }) {
  return (
    <>
      <StatsRow data={data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <StorageByApp apps={data.byApp} totalBytes={data.totalBytes} />
        <LargestBundles bundles={data.largestBundles} />
      </div>
      <StorageGrowthChart history={data.growthHistory} />
    </>
  )
}

interface PageHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  orphanedCount: number
  onCleanup: () => void
  isCleaning: boolean
}

function PageHeader({ onRefresh, isRefreshing, orphanedCount, onCleanup, isCleaning }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Storage</h1>
        <p className="text-text-light mt-1">Monitor R2 storage usage and bundle metrics</p>
      </div>
      <div className="flex items-center gap-2">
        {orphanedCount > 0 && (
          <Button variant="outline" size="sm" onClick={onCleanup} disabled={isCleaning}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clean {orphanedCount} orphaned
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  )
}

function StatsRow({ data }: { data: StorageMetrics }) {
  const stats = [
    { label: 'Total Storage', value: formatBytes(data.totalBytes), icon: HardDrive, color: 'text-pastel-blue' },
    { label: 'Total Bundles', value: data.totalBundles.toLocaleString(), icon: Package, color: 'text-pastel-green' },
    { label: 'Apps', value: String(data.byApp.length), icon: TrendingUp, color: 'text-pastel-purple' },
    {
      label: 'Orphaned',
      value: String(data.orphanedBundles),
      icon: data.orphanedBundles > 0 ? AlertTriangle : Package,
      color: data.orphanedBundles > 0 ? 'text-pastel-yellow' : 'text-text-light',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

function StorageByApp({ apps, totalBytes }: { apps: StorageAppMetrics[]; totalBytes: number }) {
  const sortedApps = [...apps].sort((a, b) => b.bytes - a.bytes).slice(0, 10)
  if (sortedApps.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Storage by App</CardTitle></CardHeader>
        <CardContent><p className="text-text-light text-center py-8">No apps found</p></CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Storage by App</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedApps.map((app) => {
            const pct = totalBytes > 0 ? (app.bytes / totalBytes) * 100 : 0
            return (
              <div key={app.appId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-text-dark text-sm truncate">{app.appName}</span>
                  <span className="text-sm text-text-light">{formatBytes(app.bytes)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-pastel-blue rounded-full" style={{ width: `${String(Math.max(pct, 1))}%` }} />
                </div>
                <p className="text-xs text-text-light mt-1">{app.bundleCount} bundles - {pct.toFixed(1)}%</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function LargestBundles({ bundles }: { bundles: StorageLargestBundle[] }) {
  if (bundles.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Largest Bundles</CardTitle></CardHeader>
        <CardContent><p className="text-text-light text-center py-8">No bundles found</p></CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Largest Bundles</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bundles.slice(0, 10).map((bundle, i) => (
            <div key={bundle.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg font-bold text-text-light w-6">#{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-medium text-text-dark text-sm truncate">{bundle.appName}</p>
                  <p className="text-xs text-text-light">v{bundle.version}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline">{formatBytes(bundle.bytes)}</Badge>
                <p className="text-xs text-text-light mt-1">{formatDate(bundle.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StorageGrowthChart({ history }: { history: Array<{ date: string; totalBytes: number }> }) {
  if (history.length === 0) return null
  const maxBytes = Math.max(...history.map((h) => h.totalBytes), 1)
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Storage Growth (30 days)</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {history.map((entry, i) => {
            const height = (entry.totalBytes / maxBytes) * 100
            return (
              <div
                key={i}
                className="flex-1 bg-pastel-blue/60 hover:bg-pastel-blue rounded-t transition-colors"
                style={{ height: `${String(height)}%` }}
                title={`${entry.date}: ${formatBytes(entry.totalBytes)}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-light">
          <span>{history[0]?.date}</span>
          <span>{history[history.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function StorageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-36" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
      <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${String(parseFloat((bytes / Math.pow(k, i)).toFixed(1)))} ${sizes[i]}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
