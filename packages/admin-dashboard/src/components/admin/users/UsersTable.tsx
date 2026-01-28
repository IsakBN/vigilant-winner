'use client'

/**
 * UsersTable Component
 *
 * Displays users in a table with:
 * - Avatar, email, name
 * - Status badges
 * - Apps/Teams count
 * - Last login
 * - Click to view action
 */

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Avatar,
    Skeleton,
    Button,
} from '@bundlenudge/shared-ui'
import type { AdminUser, UserStatus } from '@/lib/api/types'

export interface UsersTableProps {
    users: AdminUser[]
    isLoading: boolean
    onUserClick: (userId: string) => void
}

export function UsersTable({ users, isLoading, onUserClick }: UsersTableProps) {
    if (isLoading) {
        return <UsersTableSkeleton />
    }

    if (users.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-text-light">No users match your filters</p>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Apps</TableHead>
                        <TableHead>Teams</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="px-4">
                                <UserCell user={user} />
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={user.status} emailVerified={user.emailVerified} />
                            </TableCell>
                            <TableCell className="text-text-dark">
                                {user.appsCount}
                            </TableCell>
                            <TableCell className="text-text-dark">
                                {user.teamsCount}
                            </TableCell>
                            <TableCell className="text-text-light text-sm">
                                {formatLastLogin(user.lastLoginAt)}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => onUserClick(user.id)}
                                    className="text-bright-accent hover:text-bright-accent/80"
                                >
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

interface UserCellProps {
    user: AdminUser
}

function UserCell({ user }: UserCellProps) {
    return (
        <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} name={user.name ?? user.email} size="md" />
            <div>
                <div className="text-sm font-medium text-text-dark">
                    {user.email}
                </div>
                {user.name && (
                    <div className="text-xs text-text-light">
                        {user.name}
                    </div>
                )}
                <div className="text-xs text-text-light">
                    Joined {formatDate(user.createdAt)}
                </div>
            </div>
        </div>
    )
}

interface StatusBadgeProps {
    status: UserStatus
    emailVerified: boolean
}

function StatusBadge({ status, emailVerified }: StatusBadgeProps) {
    return (
        <div className="flex flex-col gap-1">
            <Badge className={STATUS_BADGE_CLASSES[status]}>
                {STATUS_LABELS[status]}
            </Badge>
            {!emailVerified && (
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                    Unverified
                </Badge>
            )}
        </div>
    )
}

function UsersTableSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Apps</TableHead>
                        <TableHead>Teams</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div>
                                        <Skeleton className="h-4 w-40 mb-1" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-yellow-100 text-yellow-700',
    banned: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<UserStatus, string> = {
    active: 'Active',
    suspended: 'Suspended',
    banned: 'Banned',
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatLastLogin(timestamp: number | null): string {
    if (!timestamp) return 'Never'

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${String(diffMins)}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${String(diffHours)}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${String(diffDays)}d ago`

    return formatDate(timestamp)
}
