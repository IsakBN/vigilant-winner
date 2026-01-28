'use client'

/**
 * ProfileForm Component
 *
 * Form for editing user profile information.
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

interface ProfileFormProps {
    accountId: string
}

export function ProfileForm({ accountId }: ProfileFormProps) {
    const [name, setName] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        // TODO: Implement profile update with auth hook
        void Promise.resolve({ accountId, name })
        setIsUpdating(false)
    }

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError('')

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters')
            return
        }

        // TODO: Implement password change
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Update your account profile information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <span className="text-xl font-semibold text-muted-foreground">
                                    ?
                                </span>
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value=""
                                    disabled
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="mt-1"
                            />
                        </div>

                        <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <hr />

                        <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        {passwordError && (
                            <p className="text-sm text-destructive">{passwordError}</p>
                        )}

                        <Button type="submit">Update Password</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
