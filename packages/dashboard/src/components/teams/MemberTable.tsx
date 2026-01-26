'use client'

/**
 * MemberTable Component
 *
 * Displays team members in a table with role management actions.
 */

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
import { RoleSelector } from './RoleSelector'
import type { TeamMember, TeamRole } from '@/lib/api'

interface MemberTableProps {
    members: TeamMember[]
    currentUserRole: TeamRole
    currentUserId: string
    isLoading?: boolean
    onRoleChange?: (memberId: string, newRole: 'admin' | 'member') => void
    onRemove?: (memberId: string) => void
    isUpdating?: boolean
}

/**
 * Get role badge variant
 */
function getRoleBadgeVariant(role: TeamRole): 'default' | 'secondary' | 'outline' {
    switch (role) {
        case 'owner':
            return 'default'
        case 'admin':
            return 'secondary'
        default:
            return 'outline'
    }
}

/**
 * Format role for display
 */
function formatRole(role: TeamRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
}

/**
 * Format date for display
 */
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

/**
 * Member avatar with fallback
 */
function MemberAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
    const initial = (name ?? 'U').charAt(0).toUpperCase()

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name ?? 'Member'}
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
function MemberTableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                </div>
            ))}
        </div>
    )
}

export function MemberTable({
    members,
    currentUserRole,
    currentUserId,
    isLoading,
    onRoleChange,
    onRemove,
    isUpdating,
}: MemberTableProps) {
    if (isLoading) {
        return <MemberTableSkeleton />
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-12 text-text-light">
                No team members found.
            </div>
        )
    }

    const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin'

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {canManageMembers && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {members.map((member) => {
                    const isCurrentUser = member.userId === currentUserId
                    const isOwner = member.role === 'owner'
                    const canModify = canManageMembers && !isCurrentUser && !isOwner

                    return (
                        <TableRow key={member.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <MemberAvatar
                                        name={member.name}
                                        avatarUrl={member.avatarUrl}
                                    />
                                    <div>
                                        <div className="font-medium text-text-dark">
                                            {member.name ?? 'Unknown'}
                                            {isCurrentUser && (
                                                <span className="ml-2 text-xs text-text-light">(you)</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-text-light">
                                            {member.email}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {canModify && onRoleChange ? (
                                    <RoleSelector
                                        value={member.role as 'admin' | 'member'}
                                        onChange={(role) => onRoleChange(member.id, role)}
                                        disabled={isUpdating}
                                    />
                                ) : (
                                    <Badge variant={getRoleBadgeVariant(member.role)}>
                                        {formatRole(member.role)}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-text-light">
                                {formatDate(member.createdAt)}
                            </TableCell>
                            {canManageMembers && (
                                <TableCell>
                                    {canModify && onRemove && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemove(member.id)}
                                            disabled={isUpdating}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
