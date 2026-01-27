'use client'

/**
 * RolloutHistoryCard Component
 *
 * Displays a timeline of rollout actions (increases, decreases, pauses, etc.)
 */

import { Clock, RotateCcw, Play, Pause } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export interface RolloutHistoryItem {
    id: string
    timestamp: number
    action: 'increase' | 'decrease' | 'pause' | 'resume' | 'rollback'
    percentage: number
    reason?: string
}

interface RolloutHistoryCardProps {
    history: RolloutHistoryItem[]
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTimeAgo(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${String(days)}d ago`
    if (hours > 0) return `${String(hours)}h ago`
    if (minutes > 0) return `${String(minutes)}m ago`
    return 'Just now'
}

function getActionIcon(action: RolloutHistoryItem['action']) {
    switch (action) {
        case 'increase':
            return <div className="w-2 h-2 rounded-full bg-green-500" />
        case 'decrease':
            return <div className="w-2 h-2 rounded-full bg-amber-500" />
        case 'pause':
            return <Pause className="w-3 h-3 text-amber-600" />
        case 'resume':
            return <Play className="w-3 h-3 text-green-600" />
        case 'rollback':
            return <RotateCcw className="w-3 h-3 text-red-600" />
    }
}

function getActionLabel(action: RolloutHistoryItem['action']): string {
    switch (action) {
        case 'increase':
            return 'Increased rollout'
        case 'decrease':
            return 'Decreased rollout'
        case 'pause':
            return 'Paused rollout'
        case 'resume':
            return 'Resumed rollout'
        case 'rollback':
            return 'Rolled back'
    }
}

// =============================================================================
// Component
// =============================================================================

export function RolloutHistoryCard({ history }: RolloutHistoryCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                        Rollout History
                    </CardTitle>
                    <span className="text-xs text-neutral-400">Last 7 days</span>
                </div>
            </CardHeader>
            <CardContent>
                {history.length > 0 ? (
                    <div className="space-y-4">
                        {history.map((item, index) => (
                            <div
                                key={item.id}
                                className={cn(
                                    'flex items-start gap-3 pb-4',
                                    index < history.length - 1 && 'border-b border-neutral-100'
                                )}
                            >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100">
                                    {getActionIcon(item.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-neutral-900">
                                            {getActionLabel(item.action)}
                                        </span>
                                        <span className="text-xs text-neutral-400">
                                            {formatTimeAgo(item.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-500">
                                        {item.action === 'pause' || item.action === 'resume' || item.action === 'rollback'
                                            ? item.reason ?? `at ${String(item.percentage)}%`
                                            : `to ${String(item.percentage)}%`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-neutral-400">
                        <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No rollout history yet</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
