'use client'

/**
 * ProfileForm Component
 *
 * Form for editing user profile information.
 */

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useUpdateProfile, useChangePassword } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ProfileFormProps {
    accountId: string
}

export function ProfileForm({ accountId }: ProfileFormProps) {
    const { user } = useAuth()
    const updateProfile = useUpdateProfile(accountId)
    const changePassword = useChangePassword(accountId)

    const [name, setName] = useState(user?.name ?? '')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await updateProfile.mutateAsync({ name })
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
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

        await changePassword.mutateAsync({
            currentPassword,
            newPassword,
        })

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
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name ?? 'Profile'}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <span className="text-xl font-semibold text-muted-foreground">
                                        {user?.name?.[0]?.toUpperCase() ??
                                            user?.email?.[0]?.toUpperCase() ??
                                            '?'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user?.email ?? ''}
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

                        <Button
                            type="submit"
                            disabled={updateProfile.isPending}
                        >
                            {updateProfile.isPending
                                ? 'Saving...'
                                : 'Save Changes'}
                        </Button>

                        {updateProfile.isSuccess && (
                            <p className="text-sm text-green-600">
                                Profile updated successfully
                            </p>
                        )}
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
                    <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="currentPassword">
                                Current Password
                            </Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                                className="mt-1"
                            />
                        </div>

                        <Separator />

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
                            <Label htmlFor="confirmPassword">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                className="mt-1"
                            />
                        </div>

                        {passwordError && (
                            <p className="text-sm text-destructive">
                                {passwordError}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={changePassword.isPending}
                        >
                            {changePassword.isPending
                                ? 'Updating...'
                                : 'Update Password'}
                        </Button>

                        {changePassword.isSuccess && (
                            <p className="text-sm text-green-600">
                                Password updated successfully
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
