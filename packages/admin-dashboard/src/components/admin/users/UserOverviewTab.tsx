'use client'

/**
 * UserOverviewTab Component
 *
 * Displays user overview information including:
 * - Basic info (email, name, created date)
 * - Status and session info
 * - Recent activity
 */

import { Badge, Label } from '@bundlenudge/shared-ui'
import type { UserTabProps } from './types'
import { formatDate, getStatusBadgeClass } from './utils'

export function UserOverviewTab({ user }: UserTabProps) {
    return (
        <div className="space-y-4 mt-4">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="text-sm font-medium">{user.name ?? 'N/A'}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Last Login</Label>
                    <p className="text-sm font-medium">{formatDate(user.lastLoginAt)}</p>
                </div>
            </div>

            {/* Status */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Status</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Account Status</Label>
                        <div className="mt-1">
                            <Badge className={getStatusBadgeClass(user.status)}>
                                {user.status}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Email Verified</Label>
                        <div className="mt-1">
                            <Badge
                                className={
                                    user.emailVerified
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                }
                            >
                                {user.emailVerified ? 'Verified' : 'Not Verified'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Stats */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Apps</Label>
                        <p className="text-sm font-medium">{user.appsCount ?? 0}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Teams</Label>
                        <p className="text-sm font-medium">{user.teamsCount ?? 0}</p>
                    </div>
                </div>
            </div>

            {/* Active Sessions */}
            {user.sessions && user.sessions.length > 0 && (
                <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                        Active Sessions ({String(user.sessions.length)})
                    </h4>
                    <div className="space-y-2">
                        {user.sessions.slice(0, 5).map((session) => (
                            <div
                                key={session.id}
                                className="text-sm border rounded p-2"
                            >
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground truncate max-w-[200px]">
                                        {session.userAgent}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {session.ipAddress}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Last active: {formatDate(session.lastActiveAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {user.recentActivity && user.recentActivity.length > 0 && (
                <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                        {user.recentActivity.slice(0, 5).map((activity) => (
                            <div
                                key={activity.id}
                                className="text-sm flex items-center justify-between"
                            >
                                <span>
                                    {activity.action} {activity.resource}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDate(activity.createdAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
