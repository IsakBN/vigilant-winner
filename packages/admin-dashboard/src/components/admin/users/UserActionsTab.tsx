'use client'

/**
 * UserActionsTab Component
 *
 * Admin actions for managing users:
 * - Verify email
 * - Suspend/unsuspend
 * - Ban/unban
 * - Revoke sessions
 * - Send password reset
 */

import { useState } from 'react'
import { Button } from '@bundlenudge/shared-ui'
import {
    useSuspendUser,
    useUnsuspendUser,
    useBanUser,
    useUnbanUser,
    useVerifyEmail,
    useSendPasswordReset,
    useRevokeAllSessions,
} from '@/hooks/useAdminUsers'
import {
    ActionCard,
    ConfirmForm,
    SuspendSection,
    BanSection,
} from './UserActionForms'
import type { UserActionsTabProps } from './types'

export function UserActionsTab({ user, onRefresh, onUserUpdated }: UserActionsTabProps) {
    // Action panel states
    const [showSuspend, setShowSuspend] = useState(false)
    const [suspendReason, setSuspendReason] = useState('')
    const [showBan, setShowBan] = useState(false)
    const [banReason, setBanReason] = useState('')
    const [showRevokeSessions, setShowRevokeSessions] = useState(false)

    // Mutations
    const suspendMutation = useSuspendUser()
    const unsuspendMutation = useUnsuspendUser()
    const banMutation = useBanUser()
    const unbanMutation = useUnbanUser()
    const verifyEmailMutation = useVerifyEmail()
    const passwordResetMutation = useSendPasswordReset()
    const revokeSessionsMutation = useRevokeAllSessions()

    const isLoading =
        suspendMutation.isPending ||
        unsuspendMutation.isPending ||
        banMutation.isPending ||
        unbanMutation.isPending ||
        verifyEmailMutation.isPending ||
        passwordResetMutation.isPending ||
        revokeSessionsMutation.isPending

    function handleSuccess() {
        onRefresh()
        onUserUpdated?.()
    }

    async function handleSuspend() {
        if (!suspendReason) return
        await suspendMutation.mutateAsync({ userId: user.id, reason: suspendReason })
        setShowSuspend(false)
        setSuspendReason('')
        handleSuccess()
    }

    async function handleUnsuspend() {
        await unsuspendMutation.mutateAsync(user.id)
        handleSuccess()
    }

    async function handleBan() {
        if (!banReason) return
        await banMutation.mutateAsync({ userId: user.id, reason: banReason })
        setShowBan(false)
        setBanReason('')
        handleSuccess()
    }

    async function handleUnban() {
        await unbanMutation.mutateAsync(user.id)
        handleSuccess()
    }

    async function handleVerifyEmail() {
        await verifyEmailMutation.mutateAsync(user.id)
        handleSuccess()
    }

    async function handleSendPasswordReset() {
        await passwordResetMutation.mutateAsync(user.id)
    }

    async function handleRevokeSessions() {
        await revokeSessionsMutation.mutateAsync(user.id)
        setShowRevokeSessions(false)
        handleSuccess()
    }

    return (
        <div className="mt-4 space-y-4">
            {/* Verify Email */}
            {!user.emailVerified && (
                <ActionCard
                    title="Verify Email"
                    description="Manually verify this user's email address."
                >
                    <Button variant="outline" onClick={handleVerifyEmail} disabled={isLoading}>
                        Verify Email
                    </Button>
                </ActionCard>
            )}

            {/* Password Reset */}
            <ActionCard
                title="Password Reset"
                description="Send a password reset email to this user."
            >
                <Button variant="outline" onClick={handleSendPasswordReset} disabled={isLoading}>
                    Send Reset Email
                </Button>
            </ActionCard>

            {/* Suspend/Unsuspend */}
            <SuspendSection
                userStatus={user.status}
                showSuspend={showSuspend}
                setShowSuspend={setShowSuspend}
                suspendReason={suspendReason}
                setSuspendReason={setSuspendReason}
                onSuspend={handleSuspend}
                onUnsuspend={handleUnsuspend}
                isLoading={isLoading}
            />

            {/* Ban/Unban */}
            <BanSection
                userStatus={user.status}
                showBan={showBan}
                setShowBan={setShowBan}
                banReason={banReason}
                setBanReason={setBanReason}
                onBan={handleBan}
                onUnban={handleUnban}
                isLoading={isLoading}
            />

            {/* Revoke Sessions */}
            <ActionCard
                title="Revoke All Sessions"
                description="Sign out this user from all devices."
            >
                {showRevokeSessions ? (
                    <ConfirmForm
                        message="This will sign out the user from all devices."
                        onCancel={() => setShowRevokeSessions(false)}
                        onSubmit={handleRevokeSessions}
                        isLoading={isLoading}
                        submitLabel="Revoke All Sessions"
                    />
                ) : (
                    <Button variant="destructive" onClick={() => setShowRevokeSessions(true)}>
                        Revoke All Sessions
                    </Button>
                )}
            </ActionCard>
        </div>
    )
}
