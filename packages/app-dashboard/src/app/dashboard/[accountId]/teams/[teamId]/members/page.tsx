'use client'

/**
 * Team Members Page
 *
 * Full list of team members with role management.
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    useTeam,
    useTeamMembers,
    useUpdateMemberRole,
    useRemoveMember,
} from '@/hooks/useTeams'
import { useAuth } from '@/providers/AuthProvider'
import { MemberTable, RemoveMemberDialog, MembersPageSkeleton } from '@/components/teams'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Button,
} from '@bundlenudge/shared-ui'

export default function TeamMembersPage() {
    const params = useParams<{ accountId: string; teamId: string }>()
    const router = useRouter()
    const { accountId, teamId } = params
    const { user } = useAuth()

    const { data: teamData, isLoading: isTeamLoading } = useTeam(accountId, teamId)
    const { members, isLoading: isMembersLoading } = useTeamMembers(accountId, teamId)
    const updateRole = useUpdateMemberRole(accountId, teamId)
    const removeMember = useRemoveMember(accountId, teamId)

    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
    const [memberToRemove, setMemberToRemove] = useState<{
        id: string
        name: string
    } | null>(null)

    const team = teamData?.team
    const isLoading = isTeamLoading || isMembersLoading

    const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
        setUpdatingMemberId(memberId)
        try {
            await updateRole.mutateAsync({ memberId, data: { role: newRole } })
        } finally {
            setUpdatingMemberId(null)
        }
    }

    const handleRemoveClick = (memberId: string) => {
        const member = members.find((m) => m.id === memberId)
        if (!member) return

        setMemberToRemove({
            id: memberId,
            name: member.name ?? member.email,
        })
    }

    const handleRemoveConfirm = async () => {
        if (!memberToRemove) return

        setUpdatingMemberId(memberToRemove.id)
        try {
            await removeMember.mutateAsync(memberToRemove.id)
            setMemberToRemove(null)
        } finally {
            setUpdatingMemberId(null)
        }
    }

    if (isLoading) {
        return <MembersPageSkeleton />
    }

    if (!team && !isTeamLoading) {
        router.replace(`/dashboard/${accountId}/teams`)
        return null
    }

    const isOwnerOrAdmin = team?.myRole === 'owner' || team?.myRole === 'admin'

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                    href={`/dashboard/${accountId}/teams`}
                    className="hover:text-foreground transition-colors"
                >
                    Teams
                </Link>
                <span>/</span>
                <Link
                    href={`/dashboard/${accountId}/teams/${teamId}`}
                    className="hover:text-foreground transition-colors"
                >
                    {team?.name ?? 'Team'}
                </Link>
                <span>/</span>
                <span className="text-foreground">Members</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Team Members</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage members and their roles in {team?.name ?? 'this team'}.
                    </p>
                </div>
                {isOwnerOrAdmin && (
                    <Button asChild>
                        <Link href={`/dashboard/${accountId}/teams/${teamId}/invitations`}>
                            Invite Member
                        </Link>
                    </Button>
                )}
            </div>

            {/* Members Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Members ({String(members.length)})</CardTitle>
                    <CardDescription>
                        All members with access to this team and its resources.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MemberTable
                        members={members}
                        currentUserRole={team?.myRole ?? 'member'}
                        currentUserId={user?.id ?? ''}
                        isLoading={isLoading}
                        onRoleChange={isOwnerOrAdmin ? handleRoleChange : undefined}
                        onRemove={isOwnerOrAdmin ? handleRemoveClick : undefined}
                        isUpdating={updatingMemberId !== null}
                    />
                </CardContent>
            </Card>

            {/* Remove Member Dialog */}
            <RemoveMemberDialog
                open={memberToRemove !== null}
                onOpenChange={(open) => {
                    if (!open) setMemberToRemove(null)
                }}
                memberName={memberToRemove?.name ?? ''}
                onConfirm={handleRemoveConfirm}
                isLoading={updatingMemberId !== null}
            />
        </div>
    )
}
