'use client'

/**
 * Teams List Page
 *
 * Main page displaying all teams for an account.
 */

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTeams, useCreateTeam } from '@/hooks/useTeams'
import { TeamCard } from '@/components/teams'
import {
    Button,
    Card,
    CardContent,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Input,
    Label,
    Skeleton,
} from '@bundlenudge/shared-ui'

/**
 * Users icon
 */
function UsersIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
        </svg>
    )
}

export default function TeamsPage() {
    const params = useParams<{ accountId: string }>()
    const accountId = params.accountId

    const { teams, isLoading, isError, error } = useTeams(accountId)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const handleOpenCreateModal = useCallback(() => {
        setIsCreateModalOpen(true)
    }, [])

    const handleCloseCreateModal = useCallback(() => {
        setIsCreateModalOpen(false)
    }, [])

    return (
        <>
            <PageHeader onCreateTeam={handleOpenCreateModal} />

            {isLoading ? (
                <TeamsListSkeleton />
            ) : isError ? (
                <ErrorState error={error} />
            ) : teams.length === 0 ? (
                <EmptyState onCreateTeam={handleOpenCreateModal} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                        <TeamCard key={team.id} team={team} accountId={accountId} />
                    ))}
                </div>
            )}

            <CreateTeamModal
                accountId={accountId}
                open={isCreateModalOpen}
                onClose={handleCloseCreateModal}
            />
        </>
    )
}

interface PageHeaderProps {
    onCreateTeam: () => void
}

function PageHeader({ onCreateTeam }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-text-dark font-heading">Teams</h1>
                <p className="text-text-light mt-1">
                    Manage your teams and collaborate with others.
                </p>
            </div>
            <Button onClick={onCreateTeam}>Create Team</Button>
        </div>
    )
}

function TeamsListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                            <Skeleton className="w-12 h-12 rounded-xl" />
                            <Skeleton className="w-16 h-6 rounded-md" />
                        </div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24 mb-4" />
                        <div className="flex items-center justify-between pt-4 border-t">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function EmptyState({ onCreateTeam }: { onCreateTeam: () => void }) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <UsersIcon className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-2">No teams yet</h3>
                <p className="text-text-light text-center mb-6 max-w-sm">
                    Create a team to collaborate with others and manage apps together.
                </p>
                <Button onClick={onCreateTeam}>Create Your First Team</Button>
            </CardContent>
        </Card>
    )
}

function ErrorState({ error }: { error: Error | null }) {
    return (
        <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
                <p className="text-destructive">
                    Failed to load teams: {error?.message ?? 'Unknown error'}
                </p>
            </CardContent>
        </Card>
    )
}

interface CreateTeamModalProps {
    accountId: string
    open: boolean
    onClose: () => void
}

function CreateTeamModal({ accountId, open, onClose }: CreateTeamModalProps) {
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const createTeam = useCreateTeam(accountId)

    const handleNameChange = (value: string) => {
        setName(value)
        // Auto-generate slug from name
        const generatedSlug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        setSlug(generatedSlug)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !slug.trim()) return

        try {
            await createTeam.mutateAsync({ name: name.trim(), slug: slug.trim() })
            setName('')
            setSlug('')
            onClose()
        } catch {
            // Error handled by mutation
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Team</DialogTitle>
                    <DialogDescription>
                        Create a new team to collaborate with others.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="team-name">Team Name</Label>
                        <Input
                            id="team-name"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="My Awesome Team"
                            disabled={createTeam.isPending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="team-slug">Team Slug</Label>
                        <Input
                            id="team-slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="my-awesome-team"
                            disabled={createTeam.isPending}
                        />
                        <p className="text-xs text-text-light">
                            Used in URLs: /teams/{slug || 'your-team'}
                        </p>
                    </div>
                    {createTeam.isError && (
                        <p className="text-sm text-destructive">
                            {createTeam.error?.message ?? 'Failed to create team'}
                        </p>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={createTeam.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || !slug.trim() || createTeam.isPending}
                        >
                            {createTeam.isPending ? 'Creating...' : 'Create Team'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
