'use client'

/**
 * ProfileInfoForm Component
 *
 * Form for editing user profile information (name, avatar).
 */

import { useState, useEffect } from 'react'
import {
    Button,
    Input,
    Label,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Avatar,
} from '@bundlenudge/shared-ui'
import { useSession } from '@/lib/auth-client'
import { useUpdateProfile } from '@/hooks/useSettings'

interface ProfileInfoFormProps {
    accountId: string
}

export function ProfileInfoForm({ accountId }: ProfileInfoFormProps) {
    const { data: session } = useSession()
    const user = session?.user
    const updateProfile = useUpdateProfile(accountId)

    const [name, setName] = useState('')

    // Initialize name from user data
    useEffect(() => {
        if (user?.name) {
            setName(user.name)
        }
    }, [user?.name])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await updateProfile.mutateAsync({ name })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                    Update your account profile information
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar
                            src={user?.image}
                            name={user?.name ?? user?.email}
                            size="lg"
                            className="h-16 w-16"
                        />
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

                    <Button type="submit" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>

                    {updateProfile.isSuccess && (
                        <p className="text-sm text-green-600">
                            Profile updated successfully
                        </p>
                    )}

                    {updateProfile.isError && (
                        <p className="text-sm text-destructive">
                            Failed to update profile. Please try again.
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
