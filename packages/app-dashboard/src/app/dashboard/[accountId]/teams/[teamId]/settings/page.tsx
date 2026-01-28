'use client'

/**
 * Team Settings Page
 *
 * Manage team settings including name, and danger zone actions.
 */

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    useTeam,
    useUpdateTeam,
    useDeleteTeam,
    useLeaveTeam,
} from '@/hooks/useTeams'
import {
    TeamSettingsForm,
    TeamSettingsSkeleton,
    DangerZone,
} from '@/components/teams'

export default function TeamSettingsPage() {
    const params = useParams<{ accountId: string; teamId: string }>()
    const router = useRouter()
    const { accountId, teamId } = params

    const { data: teamData, isLoading } = useTeam(accountId, teamId)
    const updateTeam = useUpdateTeam(accountId, teamId)
    const deleteTeam = useDeleteTeam(accountId)
    const leaveTeam = useLeaveTeam(accountId, teamId)

    const team = teamData?.team

    // Show loading state
    if (isLoading) {
        return <TeamSettingsSkeleton />
    }

    // Redirect if team not found
    if (!team) {
        router.replace(`/dashboard/${accountId}/teams`)
        return null
    }

    // Redirect non-admins/owners
    if (team.myRole !== 'owner' && team.myRole !== 'admin') {
        router.replace(`/dashboard/${accountId}/teams/${teamId}`)
        return null
    }

    const isOwner = team.myRole === 'owner'

    const handleUpdate = async (data: { name: string }) => {
        await updateTeam.mutateAsync(data)
    }

    const handleLeaveTeam = async () => {
        await leaveTeam.mutateAsync()
        router.replace(`/dashboard/${accountId}/teams`)
    }

    const handleDeleteTeam = async () => {
        await deleteTeam.mutateAsync(teamId)
        router.replace(`/dashboard/${accountId}/teams`)
    }

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
                    {team.name}
                </Link>
                <span>/</span>
                <span className="text-foreground">Settings</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Team Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage settings for {team.name}.
                </p>
            </div>

            {/* General Settings Form */}
            <TeamSettingsForm
                team={team}
                onUpdate={handleUpdate}
                isUpdating={updateTeam.isPending}
            />

            {/* Danger Zone */}
            <DangerZone
                teamName={team.name}
                isOwner={isOwner}
                onLeaveTeam={handleLeaveTeam}
                onDeleteTeam={handleDeleteTeam}
                isLeavePending={leaveTeam.isPending}
                isDeletePending={deleteTeam.isPending}
            />
        </div>
    )
}
