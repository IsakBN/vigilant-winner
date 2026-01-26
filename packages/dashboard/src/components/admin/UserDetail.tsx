'use client'

/**
 * UserDetail Component
 *
 * Displays detailed user information for admin review.
 */

import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@/components/ui'
import type { AdminUserDetail, UserStatus } from '@/lib/api'

interface UserDetailProps {
    user: AdminUserDetail | undefined
    isLoading?: boolean
}

/**
 * Get status badge variant
 */
function getStatusBadgeVariant(status: UserStatus): 'default' | 'secondary' | 'destructive' {
    switch (status) {
        case 'active':
            return 'default'
        case 'suspended':
            return 'secondary'
        case 'banned':
            return 'destructive'
        default:
            return 'secondary'
    }
}

/**
 * Format date for display
 */
function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

/**
 * User avatar with fallback
 */
function UserAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
    const initial = (name ?? 'U').charAt(0).toUpperCase()

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name ?? 'User'}
                className="w-16 h-16 rounded-full object-cover"
            />
        )
    }

    return (
        <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-xl font-medium">
            {initial}
        </div>
    )
}

function UserDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        </div>
    )
}

export function UserDetail({ user, isLoading }: UserDetailProps) {
    if (isLoading) {
        return <UserDetailSkeleton />
    }

    if (!user) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-text-light">
                    User not found.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-text-dark">
                                {user.name ?? 'Unknown User'}
                            </h2>
                            <p className="text-text-light">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={getStatusBadgeVariant(user.status)}>
                                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                </Badge>
                                {user.emailVerified ? (
                                    <Badge variant="default">Email Verified</Badge>
                                ) : (
                                    <Badge variant="outline">Email Unverified</Badge>
                                )}
                            </div>
                        </div>
                        <div className="text-right text-sm text-text-light">
                            <p>User ID: {user.id}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Apps" value={user.appsCount} />
                <StatCard title="Teams" value={user.teamsCount} />
                <StatCard title="Sessions" value={user.sessions.length} />
                <StatCard title="Last Login" value={formatDate(user.lastLoginAt)} isText />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.sessions.length === 0 ? (
                            <p className="text-text-light text-sm">No active sessions</p>
                        ) : (
                            <div className="space-y-3">
                                {user.sessions.slice(0, 5).map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-start justify-between border-b pb-3 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-text-dark">
                                                {session.ipAddress}
                                            </p>
                                            <p className="text-xs text-text-light truncate max-w-[200px]">
                                                {session.userAgent}
                                            </p>
                                        </div>
                                        <div className="text-xs text-text-light">
                                            {formatRelativeTime(session.lastActiveAt)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.recentActivity.length === 0 ? (
                            <p className="text-text-light text-sm">No recent activity</p>
                        ) : (
                            <div className="space-y-3">
                                {user.recentActivity.slice(0, 5).map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start justify-between border-b pb-3 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-text-dark">
                                                {activity.action}
                                            </p>
                                            <p className="text-xs text-text-light">
                                                {activity.resource}
                                                {activity.resourceId && `: ${activity.resourceId}`}
                                            </p>
                                        </div>
                                        <div className="text-xs text-text-light">
                                            {formatRelativeTime(activity.createdAt)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-text-light">Created</p>
                            <p className="font-medium">{formatDate(user.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-text-light">Last Login</p>
                            <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({
    title,
    value,
    isText = false,
}: {
    title: string
    value: number | string
    isText?: boolean
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-sm text-text-light">{title}</p>
                <p className={`font-semibold ${isText ? 'text-sm' : 'text-2xl'} text-text-dark`}>
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}
