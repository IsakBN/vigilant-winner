'use client'

/**
 * User Action Form Components
 *
 * Reusable form components for user admin actions.
 */

import { Button, Label } from '@bundlenudge/shared-ui'
import { Textarea } from '@/components/ui/textarea'

/**
 * Action Card wrapper component
 */
export interface ActionCardProps {
    title: string
    description: string
    children: React.ReactNode
}

export function ActionCard({ title, description, children }: ActionCardProps) {
    return (
        <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            {children}
        </div>
    )
}

/**
 * Reason input form for suspend/ban actions
 */
export interface ReasonFormProps {
    label: string
    reason: string
    onReasonChange: (value: string) => void
    onCancel: () => void
    onSubmit: () => void
    isLoading: boolean
    submitLabel: string
    placeholder?: string
    minLength?: number
}

export function ReasonForm({
    label,
    reason,
    onReasonChange,
    onCancel,
    onSubmit,
    isLoading,
    submitLabel,
    placeholder = 'Enter reason...',
    minLength = 10,
}: ReasonFormProps) {
    return (
        <div className="space-y-3">
            <div>
                <Label>{label}</Label>
                <Textarea
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    onClick={onSubmit}
                    disabled={reason.length < minLength || isLoading}
                >
                    {submitLabel}
                </Button>
            </div>
        </div>
    )
}

/**
 * Confirmation form for destructive actions
 */
export interface ConfirmFormProps {
    message: string
    onCancel: () => void
    onSubmit: () => void
    isLoading: boolean
    submitLabel: string
}

export function ConfirmForm({
    message,
    onCancel,
    onSubmit,
    isLoading,
    submitLabel,
}: ConfirmFormProps) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-red-600">{message}</p>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="destructive" onClick={onSubmit} disabled={isLoading}>
                    {submitLabel}
                </Button>
            </div>
        </div>
    )
}

/**
 * Suspend section for user actions
 */
export interface SuspendSectionProps {
    userStatus: string
    showSuspend: boolean
    setShowSuspend: (show: boolean) => void
    suspendReason: string
    setSuspendReason: (reason: string) => void
    onSuspend: () => void
    onUnsuspend: () => void
    isLoading: boolean
}

export function SuspendSection({
    userStatus,
    showSuspend,
    setShowSuspend,
    suspendReason,
    setSuspendReason,
    onSuspend,
    onUnsuspend,
    isLoading,
}: SuspendSectionProps) {
    const isSuspended = userStatus === 'suspended'
    const isBanned = userStatus === 'banned'

    return (
        <ActionCard
            title="Account Suspension"
            description={
                isSuspended
                    ? 'This user is currently suspended.'
                    : "Suspend this user's account to prevent access."
            }
        >
            {isSuspended ? (
                <Button variant="outline" onClick={onUnsuspend} disabled={isLoading}>
                    Unsuspend Account
                </Button>
            ) : showSuspend ? (
                <ReasonForm
                    label="Reason for Suspension"
                    reason={suspendReason}
                    onReasonChange={setSuspendReason}
                    onCancel={() => {
                        setShowSuspend(false)
                        setSuspendReason('')
                    }}
                    onSubmit={onSuspend}
                    isLoading={isLoading}
                    submitLabel="Suspend Account"
                    placeholder="Explain why this account is being suspended..."
                />
            ) : (
                <Button
                    variant="destructive"
                    onClick={() => setShowSuspend(true)}
                    disabled={isBanned}
                >
                    Suspend Account
                </Button>
            )}
        </ActionCard>
    )
}

/**
 * Ban section for user actions
 */
export interface BanSectionProps {
    userStatus: string
    showBan: boolean
    setShowBan: (show: boolean) => void
    banReason: string
    setBanReason: (reason: string) => void
    onBan: () => void
    onUnban: () => void
    isLoading: boolean
}

export function BanSection({
    userStatus,
    showBan,
    setShowBan,
    banReason,
    setBanReason,
    onBan,
    onUnban,
    isLoading,
}: BanSectionProps) {
    const isBanned = userStatus === 'banned'

    return (
        <ActionCard
            title="Account Ban"
            description={
                isBanned
                    ? 'This user is permanently banned.'
                    : 'Permanently ban this user from the platform.'
            }
        >
            {isBanned ? (
                <Button variant="outline" onClick={onUnban} disabled={isLoading}>
                    Unban Account
                </Button>
            ) : showBan ? (
                <ReasonForm
                    label="Reason for Ban"
                    reason={banReason}
                    onReasonChange={setBanReason}
                    onCancel={() => {
                        setShowBan(false)
                        setBanReason('')
                    }}
                    onSubmit={onBan}
                    isLoading={isLoading}
                    submitLabel="Ban Account"
                    placeholder="Explain why this account is being banned..."
                />
            ) : (
                <Button variant="destructive" onClick={() => setShowBan(true)}>
                    Ban Account
                </Button>
            )}
        </ActionCard>
    )
}
