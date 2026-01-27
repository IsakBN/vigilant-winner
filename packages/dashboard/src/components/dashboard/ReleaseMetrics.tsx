'use client'

import { cn } from '@/lib/utils'
import { Sparkline } from './Sparkline'

// ============================================================================
// Types
// ============================================================================

export interface ReleaseStats {
  check: number
  download: number
  applied: number
  rollback: number
}

export interface ReleaseMetricsProps {
  stats: ReleaseStats
  mode?: 'mini' | 'full'
  sparklineData?: number[]
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const EMPTY_STATS: ReleaseStats = {
  check: 0,
  download: 0,
  applied: 0,
  rollback: 0,
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format large numbers for display
 * 12400 -> "12.4k", 1200000 -> "1.2M"
 */
function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`
  }
  return String(count)
}

/**
 * Calculate applied percentage from stats
 */
function calculateAppliedRate(stats: ReleaseStats): number {
  if (stats.download === 0) {
    return 0
  }
  return Math.round((stats.applied / stats.download) * 100)
}

/**
 * Get color for applied rate
 */
function getAppliedRateColor(rate: number): 'success' | 'warning' | 'destructive' {
  if (rate >= 95) return 'success'
  if (rate >= 80) return 'warning'
  return 'destructive'
}

// ============================================================================
// Components
// ============================================================================

/**
 * Mini metrics display for release list rows
 * Shows downloads and applied % with optional sparkline
 */
function MiniMetrics({
  stats,
  sparklineData,
  className,
}: {
  stats: ReleaseStats
  sparklineData?: number[]
  className?: string
}) {
  const hasData = stats.download > 0 || stats.applied > 0 || stats.check > 0
  const appliedRate = calculateAppliedRate(stats)

  if (!hasData) {
    return (
      <div className={cn('flex items-center gap-3 text-neutral-400', className)}>
        <span className="text-xs">No data yet</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Downloads */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-neutral-500">Downloads</span>
        <span className="font-mono text-sm font-medium text-neutral-900">
          {formatCount(stats.download)}
        </span>
      </div>

      {/* Applied Rate */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-neutral-500">Applied</span>
        <span
          className={cn(
            'font-mono text-sm font-medium',
            appliedRate >= 95 && 'text-success',
            appliedRate >= 80 && appliedRate < 95 && 'text-amber-600',
            appliedRate < 80 && 'text-destructive'
          )}
        >
          {appliedRate}%
        </span>
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="w-16 h-5">
          <Sparkline
            data={sparklineData}
            width={64}
            height={20}
            color={getAppliedRateColor(appliedRate)}
            showArea
          />
        </div>
      )}
    </div>
  )
}

/**
 * Full metrics display for release detail page
 * Shows all stats with visual chart
 */
function FullMetrics({
  stats,
  sparklineData,
  className,
}: {
  stats: ReleaseStats
  sparklineData?: number[]
  className?: string
}) {
  const hasData = stats.download > 0 || stats.applied > 0 || stats.check > 0
  const appliedRate = calculateAppliedRate(stats)

  if (!hasData) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 text-center',
          className
        )}
      >
        <div className="text-neutral-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-sm text-neutral-500">No metrics data yet</p>
        <p className="text-xs text-neutral-400 mt-1">
          Metrics will appear once devices start checking for updates
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Checks" value={stats.check} />
        <MetricCard label="Downloads" value={stats.download} />
        <MetricCard
          label="Applied"
          value={stats.applied}
          highlight="success"
          sublabel={`${String(appliedRate)}% rate`}
        />
        <MetricCard
          label="Rollbacks"
          value={stats.rollback}
          highlight={stats.rollback > 0 ? 'destructive' : undefined}
        />
      </div>

      {/* Trend Chart */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-3">
            Adoption Trend
          </div>
          <div className="h-16">
            <Sparkline
              data={sparklineData}
              width={640}
              height={64}
              color={getAppliedRateColor(appliedRate)}
              showArea
            />
          </div>
        </div>
      )}

      {/* Update Funnel */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <div className="text-xs text-neutral-500 uppercase tracking-wide mb-3">
          Update Funnel
        </div>
        <FunnelBar stats={stats} />
      </div>
    </div>
  )
}

/**
 * Single metric card
 */
function MetricCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string
  value: number
  sublabel?: string
  highlight?: 'success' | 'destructive'
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div
        className={cn(
          'text-2xl font-semibold',
          highlight === 'success' && 'text-success',
          highlight === 'destructive' && 'text-destructive',
          !highlight && 'text-neutral-900'
        )}
      >
        {formatCount(value)}
      </div>
      {sublabel && (
        <div className="text-xs text-neutral-400 mt-1">{sublabel}</div>
      )}
    </div>
  )
}

/**
 * Visual funnel showing check -> download -> applied flow
 */
function FunnelBar({ stats }: { stats: ReleaseStats }) {
  const maxValue = Math.max(stats.check, stats.download, stats.applied, 1)

  const stages = [
    { label: 'Checks', value: stats.check, color: 'bg-neutral-400' },
    { label: 'Downloads', value: stats.download, color: 'bg-blue-500' },
    { label: 'Applied', value: stats.applied, color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="w-20 text-xs text-neutral-600 shrink-0">
              {stage.label}
            </div>
            <div className="flex-1 h-6 bg-neutral-200 rounded overflow-hidden">
              <div
                className={cn('h-full transition-all duration-500', stage.color)}
                style={{ width: `${String(percentage)}%` }}
              />
            </div>
            <div className="w-16 text-right font-mono text-sm text-neutral-700 shrink-0">
              {formatCount(stage.value)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Release metrics display component
 *
 * @param stats - Release statistics (check, download, applied, rollback counts)
 * @param mode - Display mode: 'mini' for list rows, 'full' for detail page
 * @param sparklineData - Optional array of numbers for sparkline chart
 * @param className - Additional CSS classes
 */
export function ReleaseMetrics({
  stats = EMPTY_STATS,
  mode = 'mini',
  sparklineData,
  className,
}: ReleaseMetricsProps) {
  if (mode === 'mini') {
    return (
      <MiniMetrics
        stats={stats}
        sparklineData={sparklineData}
        className={className}
      />
    )
  }

  return (
    <FullMetrics
      stats={stats}
      sparklineData={sparklineData}
      className={className}
    />
  )
}

export { ReleaseMetrics as default }
