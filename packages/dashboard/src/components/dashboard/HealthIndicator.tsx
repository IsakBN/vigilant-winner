'use client'

import { cn } from '@/lib/utils'

export interface HealthIndicatorProps {
  /** Crash-free rate as a percentage (0-100) */
  crashFreeRate: number | null | undefined
  /** Show the percentage value alongside the indicator */
  showValue?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
  className?: string
}

type HealthStatus = 'success' | 'warning' | 'destructive'

function getHealthStatus(rate: number): HealthStatus {
  if (rate >= 99) return 'success'
  if (rate >= 95) return 'warning'
  return 'destructive'
}

const STATUS_CONFIG: Record<HealthStatus, { label: string; className: string; dotClassName: string }> = {
  success: {
    label: 'Healthy',
    className: 'text-success',
    dotClassName: 'bg-success',
  },
  warning: {
    label: 'Degraded',
    className: 'text-warning',
    dotClassName: 'bg-warning',
  },
  destructive: {
    label: 'Critical',
    className: 'text-destructive',
    dotClassName: 'bg-destructive',
  },
}

/**
 * HealthIndicator displays a crash-free rate with a colored status indicator.
 *
 * Thresholds:
 * - Green (success): >= 99%
 * - Yellow (warning): 95-99%
 * - Red (destructive): < 95%
 */
export function HealthIndicator({
  crashFreeRate,
  showValue = true,
  size = 'sm',
  className,
}: HealthIndicatorProps) {
  // Handle missing data
  if (crashFreeRate === null || crashFreeRate === undefined) {
    return (
      <span className={cn('text-neutral-400', className)}>
        -
      </span>
    )
  }

  const status = getHealthStatus(crashFreeRate)
  const config = STATUS_CONFIG[status]

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn('rounded-full', dotSize, config.dotClassName)}
        title={config.label}
        aria-label={config.label}
      />
      {showValue && (
        <span className={cn('font-mono', textSize, config.className)}>
          {crashFreeRate.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

export { HealthIndicator as default }
