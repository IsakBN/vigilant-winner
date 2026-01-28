'use client'

/**
 * TrendLine Component
 *
 * A simple trend visualization using CSS bars to show data over time.
 * Works without any external charting library.
 */

interface TrendDataPoint {
    label: string
    value: number
    secondaryValue?: number
}

interface TrendLineProps {
    data: TrendDataPoint[]
    height?: number
    showLabels?: boolean
    primaryColor?: string
    secondaryColor?: string
}

export function TrendLine({
    data,
    height = 80,
    showLabels = true,
    primaryColor = 'bg-primary',
    secondaryColor = 'bg-red-400',
}: TrendLineProps) {
    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-muted-foreground text-sm"
                style={{ height }}
            >
                No data available
            </div>
        )
    }

    const maxValue = Math.max(...data.map((d) => d.value + (d.secondaryValue ?? 0)), 1)

    return (
        <div className="w-full">
            <div
                className="flex items-end justify-between gap-1"
                style={{ height }}
            >
                {data.map((point, index) => {
                    const primaryHeight = (point.value / maxValue) * 100
                    const secondaryHeight = point.secondaryValue
                        ? (point.secondaryValue / maxValue) * 100
                        : 0

                    return (
                        <div
                            key={index}
                            className="flex-1 flex flex-col items-center gap-0.5"
                            title={`${point.label}: ${String(point.value)}${point.secondaryValue ? ` (${String(point.secondaryValue)} failures)` : ''}`}
                        >
                            <div
                                className="w-full flex flex-col justify-end"
                                style={{ height: `${String(height - 20)}px` }}
                            >
                                {secondaryHeight > 0 && (
                                    <div
                                        className={`w-full rounded-t-sm ${secondaryColor} transition-all duration-300`}
                                        style={{
                                            height: `${String(secondaryHeight)}%`,
                                            minHeight: secondaryHeight > 0 ? '2px' : '0',
                                        }}
                                    />
                                )}
                                <div
                                    className={`w-full ${secondaryHeight > 0 ? '' : 'rounded-t-sm'} rounded-b-sm ${primaryColor} transition-all duration-300`}
                                    style={{
                                        height: `${String(primaryHeight)}%`,
                                        minHeight: point.value > 0 ? '2px' : '0',
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
            {showLabels && (
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    {data.map((point, index) => (
                        <span
                            key={index}
                            className="flex-1 text-center truncate"
                        >
                            {point.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * TrendLineSkeleton Component
 *
 * Loading state for TrendLine.
 */
export function TrendLineSkeleton({ height = 80 }: { height?: number }) {
    return (
        <div className="w-full">
            <div
                className="flex items-end justify-between gap-1 animate-pulse"
                style={{ height }}
            >
                {Array.from({ length: 7 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex-1 bg-muted rounded-sm"
                        style={{
                            height: `${String(20 + Math.random() * 60)}%`,
                        }}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-2">
                {Array.from({ length: 7 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex-1 h-3 mx-0.5 bg-muted rounded animate-pulse"
                    />
                ))}
            </div>
        </div>
    )
}
