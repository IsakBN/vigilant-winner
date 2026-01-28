'use client'

/**
 * ChannelList Component
 *
 * Displays a grid of channel cards with loading and empty states.
 */

import { Radio } from 'lucide-react'
import { Skeleton, Card, CardContent } from '@bundlenudge/shared-ui'
import { ChannelCard } from './ChannelCard'
import type { Channel } from '@/hooks'

// =============================================================================
// Types
// =============================================================================

interface ChannelListProps {
    channels: Channel[]
    appId: string
    accountId: string
    isLoading: boolean
    onCreateClick?: () => void
}

// =============================================================================
// Loading State
// =============================================================================

function ChannelListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <Skeleton className="w-16 h-5 rounded" />
                        </div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24 mb-4" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-1.5 w-full rounded-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyChannelState() {
    return (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Radio className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark mb-2">
                No custom channels
            </h3>
            <p className="text-sm text-text-light max-w-sm mx-auto">
                Your app uses the default Production, Staging, and Development channels.
            </p>
        </div>
    )
}

// =============================================================================
// Component
// =============================================================================

export function ChannelList({
    channels,
    appId,
    accountId,
    isLoading,
}: ChannelListProps) {
    if (isLoading) {
        return <ChannelListSkeleton />
    }

    if (channels.length === 0) {
        return <EmptyChannelState />
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => (
                <ChannelCard
                    key={channel.id}
                    channel={channel}
                    appId={appId}
                    accountId={accountId}
                />
            ))}
        </div>
    )
}
