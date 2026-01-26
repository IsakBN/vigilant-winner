'use client'

/**
 * InviteForm Component
 *
 * Form for inviting new members to a team by email.
 */

import { useState, useCallback, type FormEvent } from 'react'
import { Button, Input, Label } from '@/components/ui'
import { RoleSelectorWithDescription } from './RoleSelector'

interface InviteFormProps {
    onSubmit: (email: string, role: 'admin' | 'member') => Promise<void>
    isSubmitting?: boolean
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function InviteForm({ onSubmit, isSubmitting }: InviteFormProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'member'>('member')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault()
            setError(null)

            const trimmedEmail = email.trim()

            if (!trimmedEmail) {
                setError('Email is required')
                return
            }

            if (!isValidEmail(trimmedEmail)) {
                setError('Please enter a valid email address')
                return
            }

            try {
                await onSubmit(trimmedEmail, role)
                setEmail('')
                setRole('member')
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to send invitation'
                setError(message)
            }
        },
        [email, role, onSubmit]
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                    }}
                    disabled={isSubmitting}
                    autoComplete="email"
                />
                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label>Role</Label>
                <RoleSelectorWithDescription
                    value={role}
                    onChange={setRole}
                    disabled={isSubmitting}
                />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
        </form>
    )
}

/**
 * Compact inline invite form
 */
interface InlineInviteFormProps {
    onSubmit: (email: string) => Promise<void>
    isSubmitting?: boolean
    placeholder?: string
}

export function InlineInviteForm({
    onSubmit,
    isSubmitting,
    placeholder = 'Enter email to invite',
}: InlineInviteFormProps) {
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault()
            setError(null)

            const trimmedEmail = email.trim()

            if (!trimmedEmail) {
                return
            }

            if (!isValidEmail(trimmedEmail)) {
                setError('Invalid email')
                return
            }

            try {
                await onSubmit(trimmedEmail)
                setEmail('')
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to invite'
                setError(message)
            }
        },
        [email, onSubmit]
    )

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1">
                <Input
                    type="email"
                    placeholder={placeholder}
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                    }}
                    disabled={isSubmitting}
                    className={error ? 'border-destructive' : ''}
                />
                {error && (
                    <p className="text-xs text-destructive mt-1">{error}</p>
                )}
            </div>
            <Button type="submit" disabled={isSubmitting || !email.trim()}>
                {isSubmitting ? 'Inviting...' : 'Invite'}
            </Button>
        </form>
    )
}
