'use client'

/**
 * Team Settings Page
 *
 * Manage team settings including name, and danger zone actions.
 */

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTeam, useUpdateTeam, useDeleteTeam } from '@/hooks/useTeams'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Button,
    Input,
    Label,
    Skeleton,
    Separator,
    useConfirm,
    useToast,
} from '@/components/ui'

export default function TeamSettingsPage() {
    const params = useParams<{ accountId: string; teamId: string }>()
    const router = useRouter()
    const { accountId, teamId } = params

    const { data: teamData, isLoading: isTeamLoading } = useTeam(accountId, teamId)
    const updateTeam = useUpdateTeam(accountId, teamId)
    const deleteTeam = useDeleteTeam(accountId)

    const team = teamData?.team

    // Redirect non-owners
    if (team && team.myRole !== 'owner' && team.myRole !== 'admin') {
        router.replace(`/dashboard/${accountId}/teams/${teamId}`)
        return null
    }

    if (isTeamLoading) {
        return <SettingsSkeleton />
    }

    if (!team) {
        router.replace(`/dashboard/${accountId}/teams`)
        return null
    }

    const isOwner = team.myRole === 'owner'

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
                    {team.name}
                </Link>
                <span>/</span>
                <span className="text-text-dark">Settings</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-dark font-heading">
                    Team Settings
                </h1>
                <p className="text-text-light mt-1">
                    Manage settings for {team.name}.
                </p>
            </div>

            {/* General Settings */}
            <GeneralSettingsCard
                team={team}
                onUpdate={updateTeam.mutateAsync}
                isUpdating={updateTeam.isPending}
            />

            {/* Danger Zone - Owner Only */}
            {isOwner && (
                <DangerZoneCard
                    teamName={team.name}
                    accountId={accountId}
                    teamId={teamId}
                    onDelete={deleteTeam.mutateAsync}
                    isDeleting={deleteTeam.isPending}
                />
            )}
        </div>
    )
}

interface GeneralSettingsCardProps {
    team: { name: string; slug: string }
    onUpdate: (data: { name?: string }) => Promise<void>
    isUpdating: boolean
}

function GeneralSettingsCard({
    team,
    onUpdate,
    isUpdating,
}: GeneralSettingsCardProps) {
    const [name, setName] = useState(team.name)
    const { toast } = useToast()

    const hasChanges = name !== team.name

    const handleSave = useCallback(async () => {
        if (!hasChanges || !name.trim()) return

        try {
            await onUpdate({ name: name.trim() })
            toast({
                title: 'Settings saved',
                description: 'Team settings have been updated.',
            })
        } catch (err) {
            toast({
                title: 'Failed to save',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'error',
            })
        }
    }, [name, hasChanges, onUpdate, toast])

    return (
        <Card>
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>
                    Update your team's basic information.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                        id="team-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isUpdating}
                        placeholder="My Team"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="team-slug">Team Slug</Label>
                    <Input
                        id="team-slug"
                        value={team.slug}
                        disabled
                        className="bg-neutral-50"
                    />
                    <p className="text-xs text-text-light">
                        The team slug cannot be changed after creation.
                    </p>
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || !name.trim() || isUpdating}
                    >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

interface DangerZoneCardProps {
    teamName: string
    accountId: string
    teamId: string
    onDelete: (teamId: string) => Promise<void>
    isDeleting: boolean
}

function DangerZoneCard({
    teamName,
    accountId,
    teamId,
    onDelete,
    isDeleting,
}: DangerZoneCardProps) {
    const router = useRouter()
    const confirm = useConfirm()
    const { toast } = useToast()
    const [confirmName, setConfirmName] = useState('')

    const handleDelete = useCallback(async () => {
        if (confirmName !== teamName) {
            toast({
                title: 'Confirmation failed',
                description: 'Please type the team name exactly to confirm.',
                variant: 'error',
            })
            return
        }

        const confirmed = await confirm({
            title: 'Delete Team',
            description: `This will permanently delete "${teamName}" and all associated data. This action cannot be undone.`,
            confirmText: 'Delete Team',
            cancelText: 'Cancel',
            variant: 'destructive',
        })

        if (!confirmed) return

        try {
            await onDelete(teamId)
            toast({
                title: 'Team deleted',
                description: 'The team has been permanently deleted.',
            })
            router.replace(`/dashboard/${accountId}/teams`)
        } catch (err) {
            toast({
                title: 'Failed to delete team',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'error',
            })
        }
    }, [confirmName, teamName, teamId, accountId, onDelete, confirm, toast, router])

    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                    Irreversible actions that will permanently affect your team.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Separator />

                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-text-dark">Delete this team</h4>
                        <p className="text-sm text-text-light mt-1">
                            Once you delete a team, there is no going back. All team members will
                            lose access, and all team data will be permanently deleted.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-name" className="text-sm">
                            Type <span className="font-mono font-semibold">{teamName}</span> to
                            confirm
                        </Label>
                        <Input
                            id="confirm-name"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={teamName}
                            disabled={isDeleting}
                        />
                    </div>

                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={confirmName !== teamName || isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Team'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function SettingsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
