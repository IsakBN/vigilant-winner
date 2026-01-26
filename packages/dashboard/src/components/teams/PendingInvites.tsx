'use client'

/**
 * PendingInvites Component
 *
 * Displays list of pending team invitations with actions.
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
import type { TeamInvitation } from '@/lib/api'

interface PendingInvitesProps {
    invitations: TeamInvitation[]
    isLoading?: boolean
    onResend?: (invitationId: string) => void
    onCancel?: (invitationId: string) => void
    isResending?: string | null
    isCancelling?: string | null
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
 * Check if invitation is expired
 */
function isExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt
}

/**
 * Get time until expiration
 */
function getExpirationText(expiresAt: number): string {
    if (isExpired(expiresAt)) {
        return 'Expired'
    }

    const diff = expiresAt - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
        return `Expires in ${days}d`
    }
    if (hours > 0) {
        return `Expires in ${hours}h`
    }
    return 'Expires soon'
}

/**
 * Loading skeleton
 */
function InvitationsSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
    )
}

/**
 * Empty state
 */
function EmptyState() {
    return (
        <div className="text-center py-12 border rounded-lg bg-neutral-50/50">
            <p className="text-text-light">No pending invitations</p>
            <p className="text-sm text-text-light mt-1">
                Invite team members using the form above
            </p>
        </div>
    )
}

export function PendingInvites({
    invitations,
    isLoading,
    onResend,
    onCancel,
    isResending,
    isCancelling,
}: PendingInvitesProps) {
    if (isLoading) {
        return <InvitationsSkeleton />
    }

    // Filter to only show pending invitations
    const pendingInvitations = invitations.filter(
        (inv) => inv.status === 'pending'
    )

    if (pendingInvitations.length === 0) {
        return <EmptyState />
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pendingInvitations.map((invitation) => {
                    const expired = isExpired(invitation.expiresAt)
                    const isResendingThis = isResending === invitation.id
                    const isCancellingThis = isCancelling === invitation.id

                    return (
                        <TableRow key={invitation.id}>
                            <TableCell>
                                <span className="font-medium">{invitation.email}</span>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {invitation.role.charAt(0).toUpperCase() +
                                        invitation.role.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-text-light">
                                {formatDate(invitation.createdAt)}
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        expired
                                            ? 'text-destructive text-sm'
                                            : 'text-text-light text-sm'
                                    }
                                >
                                    {getExpirationText(invitation.expiresAt)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {onResend && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onResend(invitation.id)}
                                            disabled={isResendingThis || isCancellingThis}
                                        >
                                            {isResendingThis ? 'Sending...' : 'Resend'}
                                        </Button>
                                    )}
                                    {onCancel && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onCancel(invitation.id)}
                                            disabled={isResendingThis || isCancellingThis}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            {isCancellingThis ? 'Cancelling...' : 'Cancel'}
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}

/**
 * Compact card-based list for smaller spaces
 */
export function PendingInvitesList({
    invitations,
    isLoading,
    onResend,
    onCancel,
    isResending,
    isCancelling,
}: PendingInvitesProps) {
    if (isLoading) {
        return <InvitationsSkeleton />
    }

    const pendingInvitations = invitations.filter(
        (inv) => inv.status === 'pending'
    )

    if (pendingInvitations.length === 0) {
        return <EmptyState />
    }

    return (
        <div className="space-y-3">
            {pendingInvitations.map((invitation) => {
                const expired = isExpired(invitation.expiresAt)
                const isResendingThis = isResending === invitation.id
                const isCancellingThis = isCancelling === invitation.id

                return (
                    <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                    >
                        <div>
                            <div className="font-medium">{invitation.email}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {invitation.role}
                                </Badge>
                                <span
                                    className={
                                        expired
                                            ? 'text-destructive text-xs'
                                            : 'text-text-light text-xs'
                                    }
                                >
                                    {getExpirationText(invitation.expiresAt)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onResend && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onResend(invitation.id)}
                                    disabled={isResendingThis || isCancellingThis}
                                >
                                    {isResendingThis ? '...' : 'Resend'}
                                </Button>
                            )}
                            {onCancel && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onCancel(invitation.id)}
                                    disabled={isResendingThis || isCancellingThis}
                                    className="text-destructive"
                                >
                                    {isCancellingThis ? '...' : 'Cancel'}
                                </Button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
