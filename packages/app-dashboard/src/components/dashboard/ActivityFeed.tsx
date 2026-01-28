'use client'

/**
 * ActivityFeed Component
 *
 * Displays a list of recent account activities with icons and timestamps.
 */

import { Card, Skeleton } from '@bundlenudge/shared-ui'
import { useRecentActivity, type ActivityType } from '@/hooks/useRecentActivity'

/**
 * Get icon for activity type
 */
function getActivityIcon(type: ActivityType): string {
    const icons: Record<ActivityType, string> = {
        release_created: '\u{1F4E6}', // package
        release_deployed: '\u{1F680}', // rocket
        build_completed: '\u{2705}', // check mark
        build_failed: '\u{274C}', // x mark
        device_registered: '\u{1F4F1}', // mobile phone
        team_member_added: '\u{1F464}', // person
    }
    return icons[type] ?? '\u{1F4DD}' // memo as default
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) {
        return 'just now'
    }
    if (diffMins < 60) {
        return `${String(diffMins)} minute${diffMins === 1 ? '' : 's'} ago`
    }
    if (diffHours < 24) {
        return `${String(diffHours)} hour${diffHours === 1 ? '' : 's'} ago`
    }
    if (diffDays < 7) {
        return `${String(diffDays)} day${diffDays === 1 ? '' : 's'} ago`
    }
    return date.toLocaleDateString()
}

/**
 * Skeleton loader for activity items
 */
function ActivityItemSkeleton() {
    return (
        <div className="flex items-start gap-3 py-3">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24 mt-1" />
            </div>
        </div>
    )
}

/**
 * Empty state when no activities
 */
function EmptyState({ accountId }: { accountId: string }) {
    return (
        <div className="py-8 text-center">
            <p className="text-text-light">
                Your recent releases and updates will appear here.
            </p>
            <div className="mt-4">
                <a
                    href={`/dashboard/${accountId}/apps`}
                    className="text-bright-accent hover:underline"
                >
                    View all apps
                </a>
            </div>
        </div>
    )
}

/**
 * Activity feed props
 */
interface ActivityFeedProps {
    accountId: string
}

/**
 * ActivityFeed component
 */
export function ActivityFeed({ accountId }: ActivityFeedProps) {
    const { data: activities, isLoading } = useRecentActivity(accountId)

    return (
        <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-dark">
                Recent Activity
            </h2>

            {isLoading ? (
                <div className="mt-4 divide-y divide-neutral-muted/30">
                    <ActivityItemSkeleton />
                    <ActivityItemSkeleton />
                    <ActivityItemSkeleton />
                </div>
            ) : !activities || activities.length === 0 ? (
                <EmptyState accountId={accountId} />
            ) : (
                <div className="mt-4 divide-y divide-neutral-muted/30">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                        >
                            <span
                                className="text-lg flex-shrink-0"
                                role="img"
                                aria-label={activity.type.replace(/_/g, ' ')}
                            >
                                {getActivityIcon(activity.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-dark truncate">
                                    {activity.message}
                                    {activity.appName && (
                                        <span className="text-text-light">
                                            {' '}
                                            in {activity.appName}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-text-light mt-0.5">
                                    {formatRelativeTime(activity.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
