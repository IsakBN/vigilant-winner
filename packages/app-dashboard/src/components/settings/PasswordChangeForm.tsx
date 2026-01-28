'use client'

/**
 * PasswordChangeForm Component
 *
 * Form for changing user password.
 */

import { useState } from 'react'
import {
    Button,
    Input,
    Label,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'
import { changePassword } from '@/lib/auth-client'

export function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const resetForm = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        // Client-side validation
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setIsPending(true)

        try {
            const result = await changePassword({
                currentPassword,
                newPassword,
            })

            if (result.error) {
                setError(result.error.message ?? 'Failed to change password')
            } else {
                setSuccess(true)
                resetForm()
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    Update your password to keep your account secure
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-1"
                            required
                        />
                    </div>

                    <hr className="border-border" />

                    <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1"
                            required
                            minLength={8}
                        />
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">
                            Confirm New Password
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1"
                            required
                            minLength={8}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {success && (
                        <p className="text-sm text-green-600">
                            Password updated successfully
                        </p>
                    )}

                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
