'use client'

/**
 * Team Overview Page
 *
 * Displays team details, recent activity, and quick stats.
 */

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTeam, useTeamMembers, useInvitations } from '@/hooks/useTeams'
import { useAuth } from '@/providers/AuthProvider'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    Button,
    Skeleton,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/components/ui'
import { MemberTable, PendingInvitesList } from '@/components/teams'
import { UsersIcon } from '@/components/icons'
import type { TeamRole } from '@/lib/api'

export default function TeamOverviewPage() {
    const params = useParams<{ accountId: string; teamId: string }>()
    const { accountId, teamId } = params
    const { user } = useAuth()

    const { data: teamData, isLoading: isTeamLoading } = useTeam(accountId, teamId)
    const { members, isLoading: isMembersLoading } = useTeamMembers(accountId, teamId)
    const { invitations, isLoading: isInvitationsLoading } = useInvitations(accountId, teamId)

    const team = teamData?.team
    const pendingInvitations = invitations.filter((inv) => inv.status === 'pending')

    if (isTeamLoading) {
        return <TeamOverviewSkeleton />
    }

    if (!team) {
        return <TeamNotFound accountId={accountId} />
    }

    const isOwnerOrAdmin = team.myRole === 'owner' || team.myRole === 'admin'

    return (
        <div className="space-y-8">
            {/* Header */}
            <TeamHeader team={team} accountId={accountId} teamId={teamId} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Members"
                    value={members.length}
                    description="Active team members"
                />
                <StatCard
                    title="Pending Invites"
                    value={pendingInvitations.length}
                    description="Awaiting response"
                />
                <StatCard
                    title="Your Role"
                    value={formatRole(team.myRole)}
                    description={getRoleDescription(team.myRole)}
                />
            </div>

            {/* Tabs for Members and Invitations */}
            <Tabs defaultValue="members" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="members">
                        Members ({members.length})
                    </TabsTrigger>
                    <TabsTrigger value="invitations">
                        Invitations ({pendingInvitations.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Team Members</CardTitle>
                            {isOwnerOrAdmin && (
                                <Button asChild size="sm">
                                    <Link href={`/dashboard/${accountId}/teams/${teamId}/invitations`}>
                                        Invite Member
                                    </Link>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <MemberTable
                                members={members.slice(0, 5)}
                                currentUserRole={team.myRole}
                                currentUserId={user?.id ?? ''}
                                isLoading={isMembersLoading}
                            />
                            {members.length > 5 && (
                                <div className="mt-4 text-center">
                                    <Button variant="ghost" asChild>
                                        <Link href={`/dashboard/${accountId}/teams/${teamId}/members`}>
                                            View All Members
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invitations">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Pending Invitations</CardTitle>
                            {isOwnerOrAdmin && (
                                <Button asChild size="sm">
                                    <Link href={`/dashboard/${accountId}/teams/${teamId}/invitations`}>
                                        Manage Invitations
                                    </Link>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <PendingInvitesList
                                invitations={pendingInvitations.slice(0, 3)}
                                isLoading={isInvitationsLoading}
                            />
                            {pendingInvitations.length > 3 && (
                                <div className="mt-4 text-center">
                                    <Button variant="ghost" asChild>
                                        <Link href={`/dashboard/${accountId}/teams/${teamId}/invitations`}>
                                            View All Invitations
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

interface TeamHeaderProps {
    team: { name: string; slug: string; myRole: TeamRole }
    accountId: string
    teamId: string
}

function TeamHeader({ team, accountId, teamId }: TeamHeaderProps) {
    const isOwnerOrAdmin = team.myRole === 'owner' || team.myRole === 'admin'

    return (
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-bright-accent/10 text-bright-accent flex items-center justify-center text-2xl font-bold">
                    {team.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-dark font-heading">
                        {team.name}
                    </h1>
                    <p className="text-text-light font-mono">@{team.slug}</p>
                </div>
                <Badge variant={getRoleBadgeVariant(team.myRole)} className="ml-2">
                    {formatRole(team.myRole)}
                </Badge>
            </div>
            {isOwnerOrAdmin && (
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/${accountId}/teams/${teamId}/settings`}>
                        Settings
                    </Link>
                </Button>
            )}
        </div>
    )
}

interface StatCardProps {
    title: string
    value: string | number
    description: string
}

function StatCard({ title, value, description }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <p className="text-sm text-text-light">{title}</p>
                <p className="text-2xl font-bold text-text-dark mt-1">{value}</p>
                <p className="text-xs text-text-light mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}

function TeamOverviewSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function TeamNotFound({ accountId }: { accountId: string }) {
    return (
        <Card className="border-destructive/50">
            <CardContent className="py-16 text-center">
                <UsersIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-text-dark mb-2">Team Not Found</h2>
                <p className="text-text-light mb-6">
                    The team you're looking for doesn't exist or you don't have access.
                </p>
                <Button asChild>
                    <Link href={`/dashboard/${accountId}/teams`}>Back to Teams</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

function formatRole(role: TeamRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
}

function getRoleDescription(role: TeamRole): string {
    switch (role) {
        case 'owner':
            return 'Full control over team'
        case 'admin':
            return 'Can manage members'
        default:
            return 'Team member'
    }
}

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
