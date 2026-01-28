'use client'

/**
 * ChannelCard Component
 *
 * Displays a single channel in a card format with status and rollout info.
 */

import Link from 'next/link'
import { Radio, Package } from 'lucide-react'
import { Card, CardContent, Badge, cn } from '@bundlenudge/shared-ui'
import type { Channel } from '@/hooks'

// =============================================================================
// Types
// =============================================================================

interface ChannelCardProps {
    channel: Channel
    appId: string
    accountId: string
}

// =============================================================================
// Helpers
// =============================================================================

const CHANNEL_COLORS: Record<string, { bg: string; text: string }> = {
    production: { bg: 'bg-green-50', text: 'text-green-700' },
    staging: { bg: 'bg-amber-50', text: 'text-amber-700' },
    development: { bg: 'bg-blue-50', text: 'text-blue-700' },
    beta: { bg: 'bg-purple-50', text: 'text-purple-700' },
}

function getChannelColors(name: string) {
    return CHANNEL_COLORS[name] ?? { bg: 'bg-neutral-50', text: 'text-neutral-700' }
}

// =============================================================================
// Rollout Progress Component
// =============================================================================

function RolloutProgress({ percentage }: { percentage: number }) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-xs text-text-light mb-1">
                <span>Rollout</span>
                <span className="font-medium">{String(percentage)}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all',
                        percentage === 100 ? 'bg-green-500' : 'bg-bright-accent'
                    )}
                    style={{ width: `${String(percentage)}%` }}
                />
            </div>
        </div>
    )
}

// =============================================================================
// Component
// =============================================================================

export function ChannelCard({ channel, appId, accountId }: ChannelCardProps) {
    const colors = getChannelColors(channel.name)
    const channelUrl = `/dashboard/${accountId}/apps/${appId}/channels/${channel.id}`

    return (
        <Link href={channelUrl} className="block group">
            <Card className="h-full transition-all hover:border-bright-accent/50 hover:shadow-md">
                <CardContent className="p-5">
                    {/* Header: Icon and Default Badge */}
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn('p-2.5 rounded-lg', colors.bg)}>
                            <Radio className={cn('w-5 h-5', colors.text)} />
                        </div>
                        {channel.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                                Default
                            </Badge>
                        )}
                    </div>

                    {/* Channel Name */}
                    <h3 className="font-semibold text-lg text-text-dark mb-1 group-hover:text-bright-accent transition-colors">
                        {channel.displayName}
                    </h3>

                    {/* Channel ID */}
                    <p className="text-sm text-text-light font-mono mb-4">
                        {channel.name}
                    </p>

                    {/* Description */}
                    {channel.description && (
                        <p className="text-sm text-text-light mb-4 line-clamp-2">
                            {channel.description}
                        </p>
                    )}

                    {/* Active Release */}
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-4 h-4 text-neutral-400" />
                        {channel.activeReleaseId ? (
                            <span className="text-sm text-text-light">
                                Release assigned
                            </span>
                        ) : (
                            <span className="text-sm text-neutral-400">No active release</span>
                        )}
                    </div>

                    {/* Rollout Progress */}
                    <RolloutProgress percentage={channel.rolloutPercentage} />
                </CardContent>
            </Card>
        </Link>
    )
}
