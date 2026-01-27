'use client'

import { cn } from '@/lib/utils'

export interface UpdateFunnelData {
  checks: number
  downloads: number
  applied: number
  active: number
}

export interface UpdateFunnelProps {
  data: UpdateFunnelData
  showDropoff?: boolean
  orientation?: 'horizontal' | 'vertical'
  compact?: boolean
  className?: string
}

const STAGE_LABELS = {
  checks: 'Checks',
  downloads: 'Downloads',
  applied: 'Applied',
  active: 'Active',
} as const

const DROPOFF_LABELS = {
  checksToDownloads: 'no update',
  downloadsToApplied: 'errors',
  appliedToActive: 'rollbacks',
} as const

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return String(value)
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) {
    return 0
  }
  return Math.round((value / total) * 100)
}

function calculateDropoff(from: number, to: number, total: number): number {
  if (total === 0) {
    return 0
  }
  return Math.round(((from - to) / total) * 100)
}

interface StageProps {
  label: string
  value: number
  percentage: number
  isFirst?: boolean
  isLast?: boolean
  compact?: boolean
}

function Stage({ label, value, percentage, isFirst, compact }: StageProps) {
  return (
    <div className={cn('flex flex-col items-center', compact ? 'min-w-[48px]' : 'min-w-[80px]')}>
      <span
        className={cn(
          'font-medium text-neutral-500 uppercase tracking-wide',
          compact ? 'text-[10px]' : 'text-xs'
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          'w-full bg-neutral-200 my-1',
          compact ? 'h-1' : 'h-1.5'
        )}
      />
      <span
        className={cn(
          'font-semibold text-neutral-900',
          compact ? 'text-sm' : 'text-lg'
        )}
      >
        {formatNumber(value)}
      </span>
      <span
        className={cn(
          'text-neutral-500',
          compact ? 'text-[10px]' : 'text-xs'
        )}
      >
        {isFirst ? '100%' : `${String(percentage)}%`}
      </span>
    </div>
  )
}

interface DropoffArrowProps {
  dropoffPercent: number
  label: string
  compact?: boolean
}

function DropoffArrow({ dropoffPercent, label, compact }: DropoffArrowProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center px-1">
        <span className="text-neutral-400 text-[10px]">-{dropoffPercent}%</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center px-2 min-w-[60px]">
      <div className="flex items-center text-neutral-400">
        <div className="w-4 h-px bg-neutral-300" />
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className="text-neutral-300"
        >
          <path
            d="M1 4H7M7 4L4 1M7 4L4 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-xs text-destructive font-medium mt-0.5">
        -{dropoffPercent}%
      </span>
      <span className="text-[10px] text-neutral-400">({label})</span>
    </div>
  )
}

interface VerticalStageProps {
  label: string
  value: number
  percentage: number
  isFirst?: boolean
  isLast?: boolean
  compact?: boolean
}

function VerticalStage({ label, value, percentage, isFirst, compact }: VerticalStageProps) {
  return (
    <div className={cn('flex items-center gap-3', compact ? 'py-1' : 'py-2')}>
      <div
        className={cn(
          'bg-neutral-200',
          compact ? 'w-1 h-6' : 'w-1.5 h-8'
        )}
      />
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span
            className={cn(
              'font-medium text-neutral-500 uppercase tracking-wide',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              'text-neutral-500',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
            {isFirst ? '100%' : `${String(percentage)}%`}
          </span>
        </div>
        <span
          className={cn(
            'font-semibold text-neutral-900',
            compact ? 'text-sm' : 'text-lg'
          )}
        >
          {formatNumber(value)}
        </span>
      </div>
    </div>
  )
}

interface VerticalDropoffProps {
  dropoffPercent: number
  label: string
  compact?: boolean
}

function VerticalDropoff({ dropoffPercent, label, compact }: VerticalDropoffProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 py-0.5">
        <div className="w-1 flex justify-center">
          <svg
            width="6"
            height="12"
            viewBox="0 0 6 12"
            fill="none"
            className="text-neutral-300"
          >
            <path
              d="M3 0V12M3 12L0.5 9.5M3 12L5.5 9.5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-[10px] text-destructive">-{dropoffPercent}%</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-1.5 flex justify-center">
        <svg
          width="8"
          height="16"
          viewBox="0 0 8 16"
          fill="none"
          className="text-neutral-300"
        >
          <path
            d="M4 0V16M4 16L1 13M4 16L7 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive font-medium">-{dropoffPercent}%</span>
        <span className="text-[10px] text-neutral-400">({label})</span>
      </div>
    </div>
  )
}

export function UpdateFunnel({
  data,
  showDropoff = true,
  orientation = 'horizontal',
  compact = false,
  className,
}: UpdateFunnelProps) {
  const { checks, downloads, applied, active } = data

  const downloadsPct = calculatePercentage(downloads, checks)
  const appliedPct = calculatePercentage(applied, checks)
  const activePct = calculatePercentage(active, checks)

  const dropoffChecksToDownloads = calculateDropoff(checks, downloads, checks)
  const dropoffDownloadsToApplied = calculateDropoff(downloads, applied, checks)
  const dropoffAppliedToActive = calculateDropoff(applied, active, checks)

  // Handle empty data
  if (checks === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-neutral-400',
          compact ? 'text-xs py-2' : 'text-sm py-4',
          className
        )}
      >
        No update data available
      </div>
    )
  }

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col', className)}>
        <VerticalStage
          label={STAGE_LABELS.checks}
          value={checks}
          percentage={100}
          isFirst
          compact={compact}
        />
        {showDropoff && (
          <VerticalDropoff
            dropoffPercent={dropoffChecksToDownloads}
            label={DROPOFF_LABELS.checksToDownloads}
            compact={compact}
          />
        )}
        <VerticalStage
          label={STAGE_LABELS.downloads}
          value={downloads}
          percentage={downloadsPct}
          compact={compact}
        />
        {showDropoff && (
          <VerticalDropoff
            dropoffPercent={dropoffDownloadsToApplied}
            label={DROPOFF_LABELS.downloadsToApplied}
            compact={compact}
          />
        )}
        <VerticalStage
          label={STAGE_LABELS.applied}
          value={applied}
          percentage={appliedPct}
          compact={compact}
        />
        {showDropoff && (
          <VerticalDropoff
            dropoffPercent={dropoffAppliedToActive}
            label={DROPOFF_LABELS.appliedToActive}
            compact={compact}
          />
        )}
        <VerticalStage
          label={STAGE_LABELS.active}
          value={active}
          percentage={activePct}
          isLast
          compact={compact}
        />
      </div>
    )
  }

  // Horizontal layout (default)
  return (
    <div className={cn('flex items-start', className)}>
      <Stage
        label={STAGE_LABELS.checks}
        value={checks}
        percentage={100}
        isFirst
        compact={compact}
      />
      {showDropoff && (
        <DropoffArrow
          dropoffPercent={dropoffChecksToDownloads}
          label={DROPOFF_LABELS.checksToDownloads}
          compact={compact}
        />
      )}
      <Stage
        label={STAGE_LABELS.downloads}
        value={downloads}
        percentage={downloadsPct}
        compact={compact}
      />
      {showDropoff && (
        <DropoffArrow
          dropoffPercent={dropoffDownloadsToApplied}
          label={DROPOFF_LABELS.downloadsToApplied}
          compact={compact}
        />
      )}
      <Stage
        label={STAGE_LABELS.applied}
        value={applied}
        percentage={appliedPct}
        compact={compact}
      />
      {showDropoff && (
        <DropoffArrow
          dropoffPercent={dropoffAppliedToActive}
          label={DROPOFF_LABELS.appliedToActive}
          compact={compact}
        />
      )}
      <Stage
        label={STAGE_LABELS.active}
        value={active}
        percentage={activePct}
        isLast
        compact={compact}
      />
    </div>
  )
}

export { UpdateFunnel as default }
