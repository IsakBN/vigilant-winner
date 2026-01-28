'use client'

/**
 * UserTable Component
 *
 * Displays admin users in a paginated table with quick actions.
 */

import Link from 'next/link'
import { Users } from 'lucide-react'
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Badge,
    Button,
} from '@/components/ui'
import { EmptyState } from '@/components/shared'
import { UserTableSkeleton } from './UserTableSkeleton'
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
        <div className="w-8 h-8 rounded-full bg-neutral-100 text-muted-foreground flex items-center justify-center text-sm font-medium">
            {initial}
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
            <EmptyState
                icon={Users}
                title="No users found"
                variant="minimal"
            />
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
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
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
                        <TableCell className="text-muted-foreground">{user.appsCount}</TableCell>
                        <TableCell className="text-muted-foreground">{user.teamsCount}</TableCell>
                        <TableCell className="text-muted-foreground">
                            {formatDate(user.lastLoginAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
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
