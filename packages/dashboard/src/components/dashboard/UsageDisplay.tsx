'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { UsageInfo } from '@/lib/api'

interface UsageDisplayProps {
  usage: UsageInfo
  accountId: string
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toLocaleString()
}

function ProgressBar({
  percentage,
  isOverLimit,
  isHardLimited
}: {
  percentage: number | null
  isOverLimit: boolean
  isHardLimited?: boolean
}) {
  if (percentage === null) {
    // Unlimited - show full green bar
    return (
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full w-full bg-success/50" />
      </div>
    )
  }

  const cappedPercentage = Math.min(percentage, 100)

  let barColor = 'bg-neutral-900'
  if (isHardLimited) {
    barColor = 'bg-destructive'
  } else if (isOverLimit) {
    barColor = 'bg-warning'
  } else if (percentage > 80) {
    barColor = 'bg-amber-500'
  }

  return (
    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all ${barColor}`}
        style={{ width: `${String(cappedPercentage)}%` }}
      />
    </div>
  )
}

export function UsageDisplay({ usage, accountId }: UsageDisplayProps) {
  const { mau, storage } = usage.usage

  // Show warning banner if over any limit
  const showWarning = mau.isOverLimit || storage.isOverLimit
  const showHardLimit = mau.isHardLimited

  return (
    <div className="mb-6 space-y-4">
      {/* Warning Banner for Over Limit */}
      {showHardLimit && (
        <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-medium">Updates Paused - MAU Limit Exceeded</h3>
              <p className="text-sm mt-1">
                You&apos;ve reached {mau.percentage}% of your {formatNumber(mau.limit ?? 0)} MAU limit.
                Updates are paused until you upgrade your plan.
              </p>
              <Button size="sm" className="mt-2" asChild>
                <Link href={`/dashboard/${accountId}/billing?upgrade=true`}>
                  Upgrade Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {showWarning && !showHardLimit && (
        <div className="px-4 py-3 bg-warning/10 border border-warning/20 text-warning-foreground">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-medium text-neutral-900">Approaching Usage Limit</h3>
              <p className="text-sm text-neutral-600 mt-1">
                {mau.isOverLimit
                  ? `You've exceeded your MAU limit (${String(mau.percentage)}% of ${formatNumber(mau.limit ?? 0)}). Consider upgrading to avoid service interruption.`
                  : `You've exceeded your storage limit (${String(storage.percentage)}% of ${String(storage.limitGb)} GB).`
                }
              </p>
              <Button size="sm" variant="outline" className="mt-2" asChild>
                <Link href={`/dashboard/${accountId}/billing`}>
                  View Plans
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MAU Card */}
        <div className="bg-white border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Monthly Active Users</span>
            <span className="text-xs text-neutral-500 capitalize">{usage.displayName} Plan</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-semibold text-neutral-900">
              {formatNumber(mau.current)}
            </span>
            {mau.limit !== null && (
              <span className="text-sm text-neutral-500">
                / {formatNumber(mau.limit)}
              </span>
            )}
            {mau.limit === null && (
              <span className="text-sm text-neutral-500">unlimited</span>
            )}
          </div>

          <ProgressBar
            percentage={mau.percentage}
            isOverLimit={mau.isOverLimit}
            isHardLimited={mau.isHardLimited}
          />

          {mau.percentage !== null && (
            <p className="text-xs text-neutral-500 mt-1">
              {mau.percentage}% used
              {mau.isHardLimited && ' - Updates paused'}
              {mau.isOverLimit && !mau.isHardLimited && ' - Over limit'}
            </p>
          )}
        </div>

        {/* Storage Card */}
        <div className="bg-white border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Storage Used</span>
            <span className="text-xs text-neutral-500">Bundles</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-semibold text-neutral-900">
              {storage.currentGb.toFixed(1)} GB
            </span>
            {storage.limitGb !== null && (
              <span className="text-sm text-neutral-500">
                / {storage.limitGb} GB
              </span>
            )}
            {storage.limitGb === null && (
              <span className="text-sm text-neutral-500">unlimited</span>
            )}
          </div>

          <ProgressBar
            percentage={storage.percentage}
            isOverLimit={storage.isOverLimit}
          />

          {storage.percentage !== null && (
            <p className="text-xs text-neutral-500 mt-1">
              {storage.percentage}% used
              {storage.isOverLimit && ' - Over limit'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export { UsageDisplay as default }
