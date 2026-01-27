'use client'

/**
 * FailureBreakdownSection - Shows failure reasons with progress bars.
 */

import { CheckCircle } from 'lucide-react'
import type { FailureBreakdown } from '@/hooks/useRollbackReports'

interface FailureBreakdownItemProps {
    item: FailureBreakdown
    maxCount: number
}

function FailureBreakdownItem({ item, maxCount }: FailureBreakdownItemProps) {
    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-700 truncate pr-4 font-mono text-xs">
                    {item.reason}
                </span>
                <span className="text-neutral-500 whitespace-nowrap">
                    {item.count} device{item.count !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

interface FailureBreakdownSectionProps {
    breakdown: FailureBreakdown[]
}

export function FailureBreakdownSection({ breakdown }: FailureBreakdownSectionProps) {
    if (breakdown.length === 0) {
        return (
            <div className="text-center py-6 text-neutral-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No failures detected</p>
            </div>
        )
    }

    const maxCount = Math.max(...breakdown.map(item => item.count))

    return (
        <div className="space-y-4">
            {breakdown.map((item, index) => (
                <FailureBreakdownItem
                    key={`${item.reason}-${index}`}
                    item={item}
                    maxCount={maxCount}
                />
            ))}
        </div>
    )
}
