'use client'

/**
 * ReleaseHistory Component - Timeline display of release events.
 */

import { Rocket, Percent, Power, PowerOff, RotateCcw, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export type HistoryEventType = 'created' | 'rollout_changed' | 'enabled' | 'disabled' | 'rollback'

export interface ReleaseHistoryEvent {
    id: string
    type: HistoryEventType
    timestamp: number
    userId?: string
    userName?: string
    metadata?: { previousRollout?: number; newRollout?: number; previousVersion?: string }
}

interface ReleaseHistoryProps {
    events: ReleaseHistoryEvent[]
    className?: string
}

const EVENT_CONFIG: Record<HistoryEventType, { icon: typeof Rocket; label: string; iconBg: string; iconColor: string }> = {
    created: { icon: Rocket, label: 'Release created', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    rollout_changed: { icon: Percent, label: 'Rollout changed', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    enabled: { icon: Power, label: 'Release enabled', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    disabled: { icon: PowerOff, label: 'Release disabled', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    rollback: { icon: RotateCcw, label: 'Rollback initiated', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
}

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function getEventDescription(event: ReleaseHistoryEvent): string {
    const config = EVENT_CONFIG[event.type]
    if (event.type === 'rollout_changed') {
        return `${config.label} from ${event.metadata?.previousRollout ?? 0}% to ${event.metadata?.newRollout ?? 0}%`
    }
    if (event.type === 'rollback' && event.metadata?.previousVersion) {
        return `${config.label} to version ${event.metadata.previousVersion}`
    }
    return config.label
}

export function ReleaseHistory({ events, className }: ReleaseHistoryProps) {
    if (events.length === 0) {
        return (
            <Card className={className}>
                <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No history events yet</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
            <CardContent>
                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-4">
                        {events.map((event, index) => {
                            const config = EVENT_CONFIG[event.type]
                            const Icon = config.icon
                            return (
                                <div key={event.id} className="relative flex gap-3 pl-0">
                                    <div className={cn('relative z-10 flex items-center justify-center w-8 h-8 rounded-full', config.iconBg)}>
                                        <Icon className={cn('w-4 h-4', config.iconColor)} />
                                    </div>
                                    <div className={cn('flex-1 pb-4', index === events.length - 1 && 'pb-0')}>
                                        <p className="text-sm font-medium">{getEventDescription(event)}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                                            {event.userName && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <span>by</span><User className="w-3 h-3" />{event.userName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface CompactReleaseHistoryProps {
    events: ReleaseHistoryEvent[]
    maxItems?: number
    className?: string
}

export function CompactReleaseHistory({ events, maxItems = 3, className }: CompactReleaseHistoryProps) {
    const displayEvents = events.slice(0, maxItems)
    return (
        <div className={cn('space-y-2', className)}>
            {displayEvents.map((event) => {
                const config = EVENT_CONFIG[event.type]
                const Icon = config.icon
                return (
                    <div key={event.id} className="flex items-center gap-2 text-sm">
                        <Icon className={cn('w-3.5 h-3.5', config.iconColor)} />
                        <span className="text-muted-foreground truncate">{getEventDescription(event)}</span>
                        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">{formatTimestamp(event.timestamp)}</span>
                    </div>
                )
            })}
            {events.length > maxItems && <p className="text-xs text-muted-foreground pl-5">+{events.length - maxItems} more events</p>}
        </div>
    )
}
