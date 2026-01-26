'use client'

/**
 * Team Invitations Page
 *
 * Invite new members and manage pending invitations.
 */

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    useTeam,
    useInvitations,
    useInviteMember,
    useResendInvitation,
    useCancelInvitation,
} from '@/hooks/useTeams'
import { InviteForm, PendingInvites } from '@/components/teams'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    useConfirm,
    useToast,
} from '@/components/ui'

export default function TeamInvitationsPage() {
    const params = useParams<{ accountId: string; teamId: string }>()
    const router = useRouter()
    const { accountId, teamId } = params
    const { toast } = useToast()
    const confirm = useConfirm()

    const { data: teamData, isLoading: isTeamLoading } = useTeam(accountId, teamId)
    const { invitations, isLoading: isInvitationsLoading } = useInvitations(
        accountId,
        teamId
    )
    const inviteMember = useInviteMember(accountId, teamId)
    const resendInvitation = useResendInvitation(accountId, teamId)
    const cancelInvitation = useCancelInvitation(accountId, teamId)

    const [resendingId, setResendingId] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    const team = teamData?.team

    const handleInvite = useCallback(
        async (email: string, role: 'admin' | 'member') => {
            try {
                await inviteMember.mutateAsync({ email, role })
                toast({
                    title: 'Invitation sent',
                    description: `An invitation has been sent to ${email}.`,
                })
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to send invitation'
                toast({
                    title: 'Failed to send invitation',
                    description: message,
                    variant: 'error',
                })
                throw err
            }
        },
        [inviteMember, toast]
    )

    const handleResend = useCallback(
        async (invitationId: string) => {
            setResendingId(invitationId)
            try {
                await resendInvitation.mutateAsync(invitationId)
                toast({
                    title: 'Invitation resent',
                    description: 'The invitation email has been resent.',
                })
            } catch (err) {
                toast({
                    title: 'Failed to resend',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'error',
                })
            } finally {
                setResendingId(null)
            }
        },
        [resendInvitation, toast]
    )

    const handleCancel = useCallback(
        async (invitationId: string) => {
            const invitation = invitations.find((inv) => inv.id === invitationId)
            if (!invitation) return

            const confirmed = await confirm({
                title: 'Cancel Invitation',
                description: `Are you sure you want to cancel the invitation to ${invitation.email}?`,
                confirmText: 'Cancel Invitation',
                cancelText: 'Keep',
                variant: 'destructive',
            })

            if (!confirmed) return

            setCancellingId(invitationId)
            try {
                await cancelInvitation.mutateAsync(invitationId)
                toast({
                    title: 'Invitation cancelled',
                    description: 'The invitation has been cancelled.',
                })
            } catch (err) {
                toast({
                    title: 'Failed to cancel',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'error',
                })
            } finally {
                setCancellingId(null)
            }
        },
        [invitations, cancelInvitation, confirm, toast]
    )

    if (!team && !isTeamLoading) {
        router.replace(`/dashboard/${accountId}/teams`)
        return null
    }

    const isOwnerOrAdmin = team?.myRole === 'owner' || team?.myRole === 'admin'

    if (!isOwnerOrAdmin && !isTeamLoading) {
        router.replace(`/dashboard/${accountId}/teams/${teamId}`)
        return null
    }

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
                <span className="text-text-dark">Invitations</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-dark font-heading">
                    Invitations
                </h1>
                <p className="text-text-light mt-1">
                    Invite new members to {team?.name ?? 'your team'} and manage pending invitations.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invite Form */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Invite Member</CardTitle>
                        <CardDescription>
                            Send an invitation by email to add someone to your team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InviteForm
                            onSubmit={handleInvite}
                            isSubmitting={inviteMember.isPending}
                        />
                    </CardContent>
                </Card>

                {/* Pending Invitations */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Pending Invitations</CardTitle>
                        <CardDescription>
                            Invitations that are awaiting acceptance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PendingInvites
                            invitations={invitations}
                            isLoading={isInvitationsLoading}
                            onResend={handleResend}
                            onCancel={handleCancel}
                            isResending={resendingId}
                            isCancelling={cancellingId}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
