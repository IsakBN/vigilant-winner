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
import { MemberTable } from '@/components/teams'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Button,
    useConfirm,
    useToast,
} from '@/components/ui'

export default function TeamMembersPage() {
    const params = useParams<{ accountId: string; teamId: string }>()
    const router = useRouter()
    const { accountId, teamId } = params
    const { user } = useAuth()
    const { toast } = useToast()
    const confirm = useConfirm()

    const { data: teamData, isLoading: isTeamLoading } = useTeam(accountId, teamId)
    const { members, isLoading: isMembersLoading } = useTeamMembers(accountId, teamId)
    const updateRole = useUpdateMemberRole(accountId, teamId)
    const removeMember = useRemoveMember(accountId, teamId)

    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)

    const team = teamData?.team
    const isLoading = isTeamLoading || isMembersLoading

    const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
        setUpdatingMemberId(memberId)
        try {
            await updateRole.mutateAsync({ memberId, data: { role: newRole } })
            toast({
                title: 'Role updated',
                description: 'Member role has been updated successfully.',
            })
        } catch (err) {
            toast({
                title: 'Failed to update role',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'error',
            })
        } finally {
            setUpdatingMemberId(null)
        }
    }

    const handleRemove = async (memberId: string) => {
        const member = members.find((m) => m.id === memberId)
        if (!member) return

        const confirmed = await confirm({
            title: 'Remove Member',
            description: `Are you sure you want to remove ${member.name ?? member.email} from the team? This action cannot be undone.`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            variant: 'destructive',
        })

        if (!confirmed) return

        setUpdatingMemberId(memberId)
        try {
            await removeMember.mutateAsync(memberId)
            toast({
                title: 'Member removed',
                description: 'The member has been removed from the team.',
            })
        } catch (err) {
            toast({
                title: 'Failed to remove member',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'error',
            })
        } finally {
            setUpdatingMemberId(null)
        }
    }

    if (!team && !isTeamLoading) {
        router.replace(`/dashboard/${accountId}/teams`)
        return null
    }

    const isOwnerOrAdmin = team?.myRole === 'owner' || team?.myRole === 'admin'

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-text-light">
                <Link
                    href={`/dashboard/${accountId}/teams`}
                    className="hover:text-text-dark transition-colors"
                >
                    Teams
                </Link>
                <span>/</span>
                <Link
                    href={`/dashboard/${accountId}/teams/${teamId}`}
                    className="hover:text-text-dark transition-colors"
                >
                    {team?.name ?? 'Team'}
                </Link>
                <span>/</span>
                <span className="text-text-dark">Members</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark font-heading">
                        Team Members
                    </h1>
                    <p className="text-text-light mt-1">
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
                    <CardTitle>Members ({members.length})</CardTitle>
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
                        onRemove={isOwnerOrAdmin ? handleRemove : undefined}
                        isUpdating={updatingMemberId !== null}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
