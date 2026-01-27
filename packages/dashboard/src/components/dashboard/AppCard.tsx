'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkline } from './Sparkline'
import { UpdateFunnel } from './UpdateFunnel'
import type { App, Release, AppHealth } from '@/lib/api'

export interface AppWithRelease extends App {
  latestRelease?: Release
}

interface AppCardProps {
  app: AppWithRelease
  accountId: string
  health?: AppHealth
}

type StatusType = 'rolling' | 'complete' | 'paused' | 'disabled' | 'failed' | 'pending' | 'rolled_back' | 'setup_required'

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  rolling: {
    label: 'Rolling',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  complete: {
    label: 'Live',
    className: 'bg-success/10 text-success border-success/20',
  },
  paused: {
    label: 'Paused',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  disabled: {
    label: 'Paused',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  rolled_back: {
    label: 'Rolled Back',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
  setup_required: {
    label: 'Setup Required',
    className: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  },
}

function getStatus(app: AppWithRelease): StatusType {
  if (!app.latestRelease) {
    return 'setup_required'
  }
  return app.latestRelease.status as StatusType
}

function formatDeviceCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return String(count)
}

function formatTrend(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${String(value)}`
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${String(days)}d ago`
  }
  if (hours > 0) {
    return `${String(hours)}h ago`
  }
  if (minutes > 0) {
    return `${String(minutes)}m ago`
  }
  return 'just now'
}

function getSparklineColor(status: 'success' | 'warning' | 'destructive' | 'neutral'): 'success' | 'warning' | 'destructive' | 'neutral' {
  return status
}

function getSuccessRateStatus(rate: number): 'success' | 'warning' | 'destructive' {
  if (rate >= 99) return 'success'
  if (rate >= 95) return 'warning'
  return 'destructive'
}

interface MiniStatProps {
  label: string
  value: string | number
  trend?: number
  sparkline?: number[]
  status?: 'success' | 'warning' | 'destructive' | 'neutral'
  isAlert?: boolean
}

function MiniStat({ label, value, trend, sparkline, status = 'neutral', isAlert }: MiniStatProps) {
  return (
    <div className="flex flex-col p-3 bg-neutral-50 border border-neutral-200 rounded-lg min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium truncate">
          {label}
        </span>
        {isAlert && (
          <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-semibold ${
            status === 'success' ? 'text-success' :
            status === 'warning' ? 'text-warning' :
            status === 'destructive' ? 'text-destructive' :
            'text-neutral-900'
          }`}>
            {value}
          </span>
          {trend !== undefined && (
            <span className={`text-[10px] font-medium ${
              trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-neutral-400'
            }`}>
              {formatTrend(trend)}
            </span>
          )}
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="w-12 h-4 shrink-0">
            <Sparkline
              data={sparkline}
              color={getSparklineColor(status)}
              width={48}
              height={16}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface SetupChecklistProps {
  appId: string
  accountId: string
}

function SetupChecklist({ appId, accountId }: SetupChecklistProps) {
  return (
    <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
      <h4 className="text-sm font-medium text-neutral-900 mb-3">Get Started</h4>
      <ul className="space-y-2 text-sm text-neutral-600">
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">1</span>
          <span>Install the SDK in your React Native app</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-xs">2</span>
          <span>Push your first release</span>
        </li>
      </ul>
      <div className="mt-3 pt-3 border-t border-neutral-200">
        <Link
          href={`/dashboard/${accountId}/apps/${appId}/setup`}
          className="text-sm text-primary hover:underline font-medium"
        >
          View setup guide
        </Link>
      </div>
    </div>
  )
}

export function AppCard({ app, accountId, health }: AppCardProps) {
  const status = getStatus(app)
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const latestRelease = app.latestRelease
  const hasRelease = Boolean(latestRelease)

  const rolloutPercentage = latestRelease?.rolloutPercentage ?? 0
  const version = latestRelease?.version
  const channel = latestRelease?.channel ?? 'production'
  const lastUpdated = latestRelease?.createdAt

  // Extract health metrics
  const devices = health?.metrics.devices
  const successRate = health?.metrics.successRate
  const rollbacks = health?.metrics.rollbacks
  const funnel = health?.funnel

  return (
    <div className="relative bg-white border border-neutral-200 hover:border-neutral-400 transition-colors">
      {/* Main clickable card area */}
      <Link
        href={`/dashboard/${accountId}/apps/${app.id}`}
        className="block p-6"
      >
        {/* Header: App name and status badge */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-semibold text-neutral-900">{app.name}</h3>
          <Badge className={`${statusConfig.className} border`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Version, channel, and time */}
        <p className="text-sm text-neutral-500 mb-4">
          {version ? (
            <>
              <span className="font-mono">{version}</span>
              <span className="mx-1.5">-</span>
              <span className="capitalize">{channel}</span>
              {lastUpdated && (
                <>
                  <span className="mx-1.5">-</span>
                  <span>pushed {getRelativeTime(lastUpdated)}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-neutral-400">No releases yet</span>
          )}
        </p>

        {/* Rollout progress bar */}
        {hasRelease && status !== 'setup_required' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Rollout</span>
              <span className="text-xs font-medium text-neutral-700">{rolloutPercentage}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  status === 'failed' || status === 'rolled_back'
                    ? 'bg-destructive'
                    : status === 'complete'
                    ? 'bg-success'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${String(rolloutPercentage)}%` }}
              />
            </div>
          </div>
        )}

        {/* Mini stat boxes with sparklines - only show if we have health data */}
        {hasRelease && health && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <MiniStat
              label="Devices"
              value={devices ? formatDeviceCount(devices.value) : '-'}
              trend={devices?.trend}
              sparkline={devices?.sparkline}
              status="neutral"
            />
            <MiniStat
              label="Success"
              value={successRate ? `${successRate.value.toFixed(1)}%` : '-'}
              sparkline={successRate?.sparkline}
              status={successRate ? getSuccessRateStatus(successRate.value) : 'neutral'}
            />
            <MiniStat
              label="Rollbacks"
              value={rollbacks?.value ?? '-'}
              status={rollbacks?.isAlert ? 'warning' : 'neutral'}
              isAlert={rollbacks?.isAlert}
            />
          </div>
        )}

        {/* Compact Update Funnel - only show if we have funnel data */}
        {hasRelease && funnel && funnel.checks > 0 && (
          <div className="mb-2">
            <div className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-2">
              Update Funnel
            </div>
            <UpdateFunnel
              data={{
                checks: funnel.checks,
                downloads: funnel.downloads,
                applied: funnel.applied,
                active: funnel.active,
              }}
              compact
              showDropoff={false}
            />
          </div>
        )}

        {/* Setup checklist for apps without releases */}
        {!hasRelease && (
          <SetupChecklist appId={app.id} accountId={accountId} />
        )}
      </Link>

      {/* Action buttons - outside the main link to allow separate click handling */}
      <div className="px-6 pb-6 pt-4 flex items-center justify-between border-t border-neutral-100">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/${accountId}/apps/${app.id}`}>
            View Releases
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/dashboard/${accountId}/apps/${app.id}?action=push`}>
            Push Update
          </Link>
        </Button>
      </div>
    </div>
  )
}

export { AppCard as default }
