'use client'

/**
 * InvitationsTable Component
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
} from '@bundlenudge/shared-ui'
import type { TeamInvitation } from '@/lib/api'

interface InvitationsTableProps {
    invitations: TeamInvitation[]
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
        return `Expires in ${String(days)}d`
    }
    if (hours > 0) {
        return `Expires in ${String(hours)}h`
    }
    return 'Expires soon'
}

export function InvitationsTable({
    invitations,
    onResend,
    onCancel,
    isResending,
    isCancelling,
}: InvitationsTableProps) {
    // Filter to only show pending invitations
    const pendingInvitations = invitations.filter(
        (inv) => inv.status === 'pending'
    )

    if (pendingInvitations.length === 0) {
        return null
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
                            <TableCell className="text-muted-foreground">
                                {formatDate(invitation.createdAt)}
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        expired
                                            ? 'text-destructive text-sm'
                                            : 'text-muted-foreground text-sm'
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
