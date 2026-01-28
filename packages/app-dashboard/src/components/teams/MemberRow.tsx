'use client'

/**
 * MemberRow Component
 *
 * Individual member row with avatar, info, role, and actions.
 */

import { TableCell, TableRow, Badge, Button } from '@bundlenudge/shared-ui'
import { RoleSelector } from './RoleSelector'
import type { TeamMember, TeamRole } from '@/lib/api'

interface MemberRowProps {
    member: TeamMember
    currentUserRole: TeamRole
    currentUserId: string
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
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
            {initial}
        </div>
    )
}

export function MemberRow({
    member,
    currentUserRole,
    currentUserId,
    onRoleChange,
    onRemove,
    isUpdating,
}: MemberRowProps) {
    const isCurrentUser = member.userId === currentUserId
    const isOwner = member.role === 'owner'
    const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin'
    const canModify = canManageMembers && !isCurrentUser && !isOwner

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
                    <div>
                        <div className="font-medium">
                            {member.name ?? 'Unknown'}
                            {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
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
            <TableCell className="text-muted-foreground">
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
}
