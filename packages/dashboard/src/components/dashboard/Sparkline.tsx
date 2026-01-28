'use client'

import { cn } from '@/lib/utils'

// SVG requires actual color values - these match Tailwind's palette:
// emerald-500, yellow-500, red-500, gray-500
const COLOR_MAP = {
  success: '#10B981',   // emerald-500
  warning: '#EAB308',   // yellow-500
  destructive: '#EF4444', // red-500
  neutral: '#6B7280',   // gray-500
} as const

type SparklineColor = keyof typeof COLOR_MAP

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: SparklineColor
  showArea?: boolean
  className?: string
}

function normalizeData(data: number[], height: number): number[] {
  if (data.length === 0) {
    return []
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min

  // If all values are the same, center them vertically
  if (range === 0) {
    return data.map(() => height / 2)
  }

  // Normalize to fit within height with some padding
  const padding = height * 0.1
  const usableHeight = height - padding * 2

  return data.map((value) => {
    const normalized = (value - min) / range
    // Invert because SVG Y-axis is top-down
    return padding + usableHeight * (1 - normalized)
  })
}

function generatePolylinePoints(
  normalizedData: number[],
  width: number
): string {
  if (normalizedData.length === 0) {
    return ''
  }

  if (normalizedData.length === 1) {
    return `0,${String(normalizedData[0])} ${String(width)},${String(normalizedData[0])}`
  }

  const stepX = width / (normalizedData.length - 1)

  return normalizedData
    .map((y, index) => `${String(index * stepX)},${String(y)}`)
    .join(' ')
}

function generateAreaPath(
  normalizedData: number[],
  width: number,
  height: number
): string {
  if (normalizedData.length === 0) {
    return ''
  }

  const stepX = normalizedData.length > 1 ? width / (normalizedData.length - 1) : 0

  // Start from bottom-left
  let path = `M 0,${String(height)}`

  // Draw line to first point
  path += ` L 0,${String(normalizedData[0])}`

  // Draw lines to each point
  normalizedData.forEach((y, index) => {
    if (index > 0) {
      path += ` L ${String(index * stepX)},${String(y)}`
    }
  })

  // Close path to bottom-right and back to start
  path += ` L ${String(width)},${String(height)} Z`

  return path
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'neutral',
  showArea = false,
  className,
}: SparklineProps) {
  const strokeColor = COLOR_MAP[color]
  const normalizedData = normalizeData(data, height)
  const points = generatePolylinePoints(normalizedData, width)
  const areaPath = showArea ? generateAreaPath(normalizedData, width, height) : ''

  // Handle empty data gracefully
  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        className={cn('overflow-visible', className)}
        aria-label="No data available"
        role="img"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={COLOR_MAP.neutral}
          strokeWidth={1}
          strokeDasharray="4 2"
          opacity={0.5}
        />
      </svg>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      className={cn('overflow-visible', className)}
      aria-label={`Sparkline chart with ${String(data.length)} data points`}
      role="img"
    >
      {showArea && (
        <path
          d={areaPath}
          fill={strokeColor}
          opacity={0.1}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { Sparkline as default }
