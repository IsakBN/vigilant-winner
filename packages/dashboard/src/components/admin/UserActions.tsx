'use client'

/**
 * UserActions Component
 *
 * Admin action buttons and modals for user management.
 */

import { useState } from 'react'
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Textarea,
    Label,
} from '@/components/ui'
import type { AdminUserDetail } from '@/lib/api'

interface UserActionsProps {
    user: AdminUserDetail | undefined
    onSuspend: (reason?: string) => void
    onUnsuspend: () => void
    onBan: (reason: string) => void
    onUnban: () => void
    onVerifyEmail: () => void
    onSendPasswordReset: () => void
    onRevokeAllSessions: () => void
    onDelete: () => void
    isPending?: boolean
}

type ActionType = 'suspend' | 'ban' | 'delete' | null

export function UserActions({
    user,
    onSuspend,
    onUnsuspend,
    onBan,
    onUnban,
    onVerifyEmail,
    onSendPasswordReset,
    onRevokeAllSessions,
    onDelete,
    isPending,
}: UserActionsProps) {
    const [activeModal, setActiveModal] = useState<ActionType>(null)
    const [reason, setReason] = useState('')

    if (!user) return null

    const handleConfirmAction = () => {
        switch (activeModal) {
            case 'suspend':
                onSuspend(reason || undefined)
                break
            case 'ban':
                if (reason.trim()) {
                    onBan(reason.trim())
                }
                break
            case 'delete':
                onDelete()
                break
        }
        setActiveModal(null)
        setReason('')
    }

    const handleOpenModal = (action: ActionType) => {
        setReason('')
        setActiveModal(action)
    }

    const canSuspend = user.status === 'active'
    const canUnsuspend = user.status === 'suspended'
    const canBan = user.status !== 'banned'
    const canUnban = user.status === 'banned'

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-dark">Account Status</h4>
                        <div className="flex flex-wrap gap-2">
                            {canSuspend && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenModal('suspend')}
                                    disabled={isPending}
                                >
                                    Suspend User
                                </Button>
                            )}
                            {canUnsuspend && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onUnsuspend}
                                    disabled={isPending}
                                >
                                    Unsuspend User
                                </Button>
                            )}
                            {canBan && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleOpenModal('ban')}
                                    disabled={isPending}
                                >
                                    Ban User
                                </Button>
                            )}
                            {canUnban && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onUnban}
                                    disabled={isPending}
                                >
                                    Unban User
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-dark">Email & Password</h4>
                        <div className="flex flex-wrap gap-2">
                            {!user.emailVerified && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onVerifyEmail}
                                    disabled={isPending}
                                >
                                    Verify Email
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onSendPasswordReset}
                                disabled={isPending}
                            >
                                Send Password Reset
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-text-dark">Sessions</h4>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRevokeAllSessions}
                                disabled={isPending || user.sessions.length === 0}
                            >
                                Revoke All Sessions ({user.sessions.length})
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenModal('delete')}
                            disabled={isPending}
                        >
                            Delete User
                        </Button>
                        <p className="text-xs text-text-light">
                            This action cannot be undone. All user data will be permanently removed.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <ActionModal
                type={activeModal}
                open={activeModal !== null}
                onClose={() => setActiveModal(null)}
                onConfirm={handleConfirmAction}
                reason={reason}
                onReasonChange={setReason}
                isPending={isPending}
            />
        </>
    )
}

interface ActionModalProps {
    type: ActionType
    open: boolean
    onClose: () => void
    onConfirm: () => void
    reason: string
    onReasonChange: (reason: string) => void
    isPending?: boolean
}

function ActionModal({
    type,
    open,
    onClose,
    onConfirm,
    reason,
    onReasonChange,
    isPending,
}: ActionModalProps) {
    const config = getModalConfig(type)
    if (!config) return null

    const needsReason = type === 'suspend' || type === 'ban'
    const isValid = type !== 'ban' || reason.trim().length > 0

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{config.title}</DialogTitle>
                    <DialogDescription>{config.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {needsReason && (
                        <div className="space-y-2">
                            <Label htmlFor="reason">
                                Reason {type === 'ban' && <span className="text-destructive">*</span>}
                            </Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => onReasonChange(e.target.value)}
                                placeholder={config.reasonPlaceholder}
                                rows={3}
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button
                            variant={type === 'delete' || type === 'ban' ? 'destructive' : 'default'}
                            onClick={onConfirm}
                            disabled={isPending || !isValid}
                        >
                            {isPending ? 'Processing...' : config.confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function getModalConfig(type: ActionType) {
    switch (type) {
        case 'suspend':
            return {
                title: 'Suspend User',
                description: 'This will temporarily prevent the user from accessing their account.',
                reasonPlaceholder: 'Optional: Enter reason for suspension...',
                confirmText: 'Suspend User',
            }
        case 'ban':
            return {
                title: 'Ban User',
                description: 'This will permanently ban the user from the platform.',
                reasonPlaceholder: 'Required: Enter reason for ban...',
                confirmText: 'Ban User',
            }
        case 'delete':
            return {
                title: 'Delete User',
                description: 'This will permanently delete the user and all associated data.',
                confirmText: 'Delete User',
            }
        default:
            return null
    }
}
