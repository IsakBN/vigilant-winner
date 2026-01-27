'use client'

/**
 * RecentRollbacksSection - Timeline of recent rollback events.
 */

import { Clock, Smartphone } from 'lucide-react'
import type { RecentRollback } from '@/hooks/useRollbackReports'

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })
}

function truncateDeviceId(deviceId: string): string {
    if (deviceId.length <= 8) return deviceId
    return `${deviceId.slice(0, 6)}...`
}

interface RecentRollbackItemProps {
    rollback: RecentRollback
}

function RecentRollbackItem({ rollback }: RecentRollbackItemProps) {
    return (
        <div className="flex items-center gap-4 py-2 border-b border-neutral-100 last:border-0">
            <div className="flex items-center gap-2 min-w-[80px]">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs text-neutral-500">
                    {formatTimestamp(rollback.timestamp)}
                </span>
            </div>
            <div className="flex items-center gap-2 min-w-[100px]">
                <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-mono text-neutral-600">
                    {truncateDeviceId(rollback.deviceId)}
                </span>
            </div>
            <span className="text-xs text-neutral-700 truncate font-mono">
                {rollback.reason}
            </span>
        </div>
    )
}

interface RecentRollbacksSectionProps {
    rollbacks: RecentRollback[]
}

export function RecentRollbacksSection({ rollbacks }: RecentRollbacksSectionProps) {
    if (rollbacks.length === 0) {
        return (
            <div className="text-center py-6 text-neutral-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent rollbacks</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-neutral-100">
            {rollbacks.map((rollback, index) => (
                <RecentRollbackItem
                    key={`${rollback.deviceId}-${rollback.timestamp}-${index}`}
                    rollback={rollback}
                />
            ))}
        </div>
    )
}
