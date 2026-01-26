'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Package, Smartphone, ArrowRight } from 'lucide-react'
import { useApp } from '@/hooks/useApp'
import { useReleases } from '@/hooks/useReleases'
import { AppHeader } from '@/components/apps/AppHeader'
import { AppStats } from '@/components/apps/AppStats'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// Types
// ============================================================================

interface Release {
  id: string
  version: string
  channel: string
  status: 'rolling' | 'complete' | 'paused' | 'failed'
  rolloutPercentage: number
  createdAt: number
}

// ============================================================================
// Helper Components
// ============================================================================

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Map API release status to UI status
 */
function mapReleaseStatus(status: string): Release['status'] {
  const statusMap: Record<string, Release['status']> = {
    active: 'rolling',
    completed: 'complete',
    paused: 'paused',
    rolled_back: 'failed',
    pending: 'rolling',
  }
  return statusMap[status] ?? 'rolling'
}

function StatusBadge({ status }: { status: Release['status'] }) {
  const config = {
    rolling: { label: 'Rolling', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    complete: { label: 'Complete', className: 'bg-green-100 text-green-700 border-green-200' },
    paused: { label: 'Paused', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
  }
  const { label, className } = config[status]
  return <Badge className={`border ${className}`}>{label}</Badge>
}

// ============================================================================
// Release List
// ============================================================================

function RecentReleases({
  releases,
  appId,
  accountId,
  isLoading,
}: {
  releases: Release[]
  appId: string
  accountId: string
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const basePath = `/dashboard/${accountId}/apps/${appId}`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Releases</CardTitle>
          <Link
            href={`${basePath}/releases`}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {releases.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No releases yet</p>
            <p className="text-xs text-neutral-400 mt-1">
              Push your first release to get started
            </p>
            <Button asChild className="mt-4">
              <Link href={`${basePath}/releases/new`}>Create Release</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {releases.slice(0, 5).map((release) => (
              <Link
                key={release.id}
                href={`${basePath}/releases/${release.id}`}
                className="flex items-center justify-between py-3 hover:bg-neutral-50 -mx-6 px-6 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100">
                    <Package className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-neutral-900">
                        v{release.version}
                      </span>
                      <StatusBadge status={release.status} />
                    </div>
                    <p className="text-xs text-neutral-500">
                      {release.channel} - {formatRelativeTime(release.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">
                    {release.rolloutPercentage}% rollout
                  </span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Quick Actions
// ============================================================================

function QuickActions({ appId, accountId }: { appId: string; accountId: string }) {
  const basePath = `/dashboard/${accountId}/apps/${appId}`

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`${basePath}/releases/new`}>
            <Package className="w-4 h-4 mr-2" />
            Create Release
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`${basePath}/devices`}>
            <Smartphone className="w-4 h-4 mr-2" />
            View Devices
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function AppOverviewPage() {
  const params = useParams()
  const appId = params.appId as string
  const accountId = params.accountId as string

  const { data: app, isLoading: appLoading, error } = useApp(appId)
  const { data: releasesData, isLoading: releasesLoading } = useReleases(appId, { pageSize: 5 })

  const isLoading = appLoading || releasesLoading

  // Transform API releases to the component format
  const releases: Release[] = (releasesData?.releases ?? []).map((r) => ({
    id: r.id,
    version: r.version,
    channel: r.channel ?? 'production',
    status: mapReleaseStatus(r.status),
    rolloutPercentage: r.rolloutPercentage ?? 100,
    createdAt: r.createdAt,
  }))

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
          Failed to load app: {error.message}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AppHeader
        appId={appId}
        accountId={accountId}
        name={app?.name ?? ''}
        platform={app?.platform ?? 'ios'}
        bundleId={app?.bundleId ?? ''}
        isLoading={isLoading}
      />

      {/* Stats */}
      <AppStats
        activeDevices={app?.stats.activeDevices ?? 0}
        totalReleases={app?.stats.totalReleases ?? 0}
        downloadsThisMonth={app?.stats.downloadsThisMonth ?? 0}
        isLoading={isLoading}
      />

      {/* Recent Releases */}
      <RecentReleases
        releases={releases}
        appId={appId}
        accountId={accountId}
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <QuickActions appId={appId} accountId={accountId} />
    </div>
  )
}
