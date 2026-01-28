'use client'

/**
 * SimpleBarChart Component
 *
 * A lightweight horizontal bar chart using CSS only (no external charting library).
 */

interface BarData {
    label: string
    value: number
    percentage: number
}

interface SimpleBarChartProps {
    data: BarData[]
    color?: 'primary' | 'blue' | 'green' | 'purple'
    showValues?: boolean
}

const colorClasses = {
    primary: 'bg-primary',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
}

export function SimpleBarChart({
    data,
    color = 'primary',
    showValues = true,
}: SimpleBarChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No data available
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[60%]">
                            {item.label}
                        </span>
                        {showValues && (
                            <span className="font-medium tabular-nums">
                                {item.value.toLocaleString()}
                                <span className="text-muted-foreground ml-1">
                                    ({String(Math.round(item.percentage))}%)
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className={`h-full transition-all duration-300 ${colorClasses[color]}`}
                            style={{ width: `${String(Math.min(item.percentage, 100))}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
