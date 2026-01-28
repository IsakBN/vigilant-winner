'use client'

/**
 * AppCard Component
 *
 * Displays a single app in a card format with key information.
 */

import Link from 'next/link'
import { PlatformBadge } from './PlatformBadge'
import { Card, CardContent } from '@bundlenudge/shared-ui'
import { PhoneIcon } from '@/components/icons'
import type { App } from '@/lib/api'

interface AppCardProps {
    app: App
    accountId: string
}

/**
 * Format device count with K/M suffix
 */
function formatDeviceCount(count: number | undefined): string {
    if (count === undefined || count === 0) return '0'
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
    return count.toString()
}

/**
 * Format relative time from timestamp
 */
function formatRelativeTime(timestamp: number | null | undefined): string {
    if (!timestamp) return 'No releases yet'

    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 30) return `${Math.floor(days / 30)}mo ago`
    if (days > 0) return `${String(days)}d ago`
    if (hours > 0) return `${String(hours)}h ago`
    if (minutes > 0) return `${String(minutes)}m ago`
    return 'just now'
}

/**
 * Get app icon placeholder based on platform
 */
function AppIconPlaceholder({ platform }: { platform: string }) {
    const bgColor = platform === 'ios' ? 'bg-neutral-100' : 'bg-green-50'
    const textColor = platform === 'ios' ? 'text-neutral-600' : 'text-green-600'

    return (
        <div
            className={`w-12 h-12 rounded-xl ${bgColor} ${textColor}
                flex items-center justify-center font-semibold text-lg`}
        >
            <PhoneIcon className="w-6 h-6" />
        </div>
    )
}

export function AppCard({ app, accountId }: AppCardProps) {
    const appUrl = `/dashboard/${accountId}/apps/${app.id}`

    return (
        <Link href={appUrl} className="block group">
            <Card className="h-full transition-all hover:border-bright-accent/50 hover:shadow-md">
                <CardContent className="p-5">
                    {/* Header: Icon and Platform Badge */}
                    <div className="flex items-start justify-between mb-4">
                        {app.iconUrl ? (
                            <img
                                src={app.iconUrl}
                                alt={`${app.name} icon`}
                                className="w-12 h-12 rounded-xl object-cover"
                            />
                        ) : (
                            <AppIconPlaceholder platform={app.platform} />
                        )}
                        <PlatformBadge platform={app.platform} />
                    </div>

                    {/* App Name */}
                    <h3 className="font-semibold text-lg text-text-dark mb-1 truncate group-hover:text-bright-accent transition-colors">
                        {app.name}
                    </h3>

                    {/* Bundle ID */}
                    {app.bundleId && (
                        <p className="text-sm text-text-light font-mono truncate mb-4">
                            {app.bundleId}
                        </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                        {/* Active Devices */}
                        <div className="flex items-center gap-1.5 text-sm text-text-light">
                            <PhoneIcon className="w-4 h-4" />
                            <span>{formatDeviceCount(app.activeDevices)} devices</span>
                        </div>

                        {/* Last Release */}
                        <div className="text-sm text-text-light">
                            {app.lastReleaseVersion ? (
                                <span>
                                    <span className="font-mono text-xs">
                                        v{app.lastReleaseVersion}
                                    </span>
                                    <span className="mx-1">-</span>
                                    {formatRelativeTime(app.lastReleaseAt)}
                                </span>
                            ) : (
                                <span className="text-neutral-400">
                                    {formatRelativeTime(app.lastReleaseAt)}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
