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
    Skeleton,
} from '@bundlenudge/shared-ui'
import { MemberRow } from './MemberRow'
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
            <div className="text-center py-12 text-muted-foreground">
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
                {members.map((member) => (
                    <MemberRow
                        key={member.id}
                        member={member}
                        currentUserRole={currentUserRole}
                        currentUserId={currentUserId}
                        onRoleChange={onRoleChange}
                        onRemove={onRemove}
                        isUpdating={isUpdating}
                    />
                ))}
            </TableBody>
        </Table>
    )
}
