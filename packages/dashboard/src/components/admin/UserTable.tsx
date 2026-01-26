'use client'

/**
 * UserTable Component
 *
 * Displays admin users in a paginated table with quick actions.
 */

import Link from 'next/link'
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Badge,
    Button,
    Skeleton,
} from '@/components/ui'
import type { AdminUser, UserStatus } from '@/lib/api'

interface UserTableProps {
    users: AdminUser[]
    isLoading?: boolean
    onSuspend?: (userId: string) => void
    onUnsuspend?: (userId: string) => void
    onVerifyEmail?: (userId: string) => void
    isActionPending?: boolean
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
    })
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
                className="w-8 h-8 rounded-full object-cover"
            />
        )
    }

    return (
        <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-sm font-medium">
            {initial}
        </div>
    )
}

/**
 * Loading skeleton for table
 */
function UserTableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    )
}

export function UserTable({
    users,
    isLoading,
    onSuspend,
    onUnsuspend,
    onVerifyEmail,
    isActionPending,
}: UserTableProps) {
    if (isLoading) {
        return <UserTableSkeleton />
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-12 text-text-light">
                No users found.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Apps</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
                                <div>
                                    <Link
                                        href={`/admin/users/${user.id}`}
                                        className="font-medium text-text-dark hover:underline"
                                    >
                                        {user.name ?? 'Unknown'}
                                    </Link>
                                    <div className="text-sm text-text-light">{user.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(user.status)}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {user.emailVerified ? (
                                <Badge variant="default">Verified</Badge>
                            ) : (
                                <Badge variant="outline">Unverified</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-text-light">{user.appsCount}</TableCell>
                        <TableCell className="text-text-light">{user.teamsCount}</TableCell>
                        <TableCell className="text-text-light">
                            {formatDate(user.lastLoginAt)}
                        </TableCell>
                        <TableCell className="text-text-light">
                            {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                {user.status === 'active' && onSuspend && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onSuspend(user.id)}
                                        disabled={isActionPending}
                                    >
                                        Suspend
                                    </Button>
                                )}
                                {user.status === 'suspended' && onUnsuspend && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onUnsuspend(user.id)}
                                        disabled={isActionPending}
                                    >
                                        Activate
                                    </Button>
                                )}
                                {!user.emailVerified && onVerifyEmail && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onVerifyEmail(user.id)}
                                        disabled={isActionPending}
                                    >
                                        Verify
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
