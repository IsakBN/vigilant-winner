'use client'

/**
 * Admin User Detail Page
 *
 * Detailed view of a single user with admin actions.
 */

import { useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    useAdminUser,
    useSuspendUser,
    useUnsuspendUser,
    useBanUser,
    useUnbanUser,
    useVerifyEmail,
    useSendPasswordReset,
    useRevokeAllSessions,
    useDeleteUser,
} from '@/hooks/useAdmin'
import { UserDetail, UserActions } from '@/components/admin'
import { Card, CardContent, useToast } from '@/components/ui'

export default function AdminUserDetailPage() {
    const params = useParams<{ userId: string }>()
    const router = useRouter()
    const { toast } = useToast()
    const userId = params.userId

    const { user, isLoading, isError, error } = useAdminUser(userId)

    const suspendUser = useSuspendUser()
    const unsuspendUser = useUnsuspendUser()
    const banUser = useBanUser()
    const unbanUser = useUnbanUser()
    const verifyEmail = useVerifyEmail()
    const sendPasswordReset = useSendPasswordReset()
    const revokeAllSessions = useRevokeAllSessions()
    const deleteUser = useDeleteUser()

    const isPending =
        suspendUser.isPending ||
        unsuspendUser.isPending ||
        banUser.isPending ||
        unbanUser.isPending ||
        verifyEmail.isPending ||
        sendPasswordReset.isPending ||
        revokeAllSessions.isPending ||
        deleteUser.isPending

    const handleSuspend = useCallback(
        (reason?: string) => {
            suspendUser.mutate(
                { userId, reason },
                {
                    onSuccess: () => {
                        toast({ title: 'User suspended', description: 'User has been suspended.' })
                    },
                    onError: (err) => {
                        toast({
                            title: 'Error',
                            description: err.message,
                            variant: 'error',
                        })
                    },
                }
            )
        },
        [userId, suspendUser, toast]
    )

    const handleUnsuspend = useCallback(() => {
        unsuspendUser.mutate(userId, {
            onSuccess: () => {
                toast({ title: 'User activated', description: 'User has been unsuspended.' })
            },
            onError: (err) => {
                toast({ title: 'Error', description: err.message, variant: 'error' })
            },
        })
    }, [userId, unsuspendUser, toast])

    const handleBan = useCallback(
        (reason: string) => {
            banUser.mutate(
                { userId, reason },
                {
                    onSuccess: () => {
                        toast({ title: 'User banned', description: 'User has been permanently banned.' })
                    },
                    onError: (err) => {
                        toast({ title: 'Error', description: err.message, variant: 'error' })
                    },
                }
            )
        },
        [userId, banUser, toast]
    )

    const handleUnban = useCallback(() => {
        unbanUser.mutate(userId, {
            onSuccess: () => {
                toast({ title: 'User unbanned', description: 'User ban has been lifted.' })
            },
            onError: (err) => {
                toast({ title: 'Error', description: err.message, variant: 'error' })
            },
        })
    }, [userId, unbanUser, toast])

    const handleVerifyEmail = useCallback(() => {
        verifyEmail.mutate(userId, {
            onSuccess: () => {
                toast({ title: 'Email verified', description: 'Email has been marked as verified.' })
            },
            onError: (err) => {
                toast({ title: 'Error', description: err.message, variant: 'error' })
            },
        })
    }, [userId, verifyEmail, toast])

    const handleSendPasswordReset = useCallback(() => {
        sendPasswordReset.mutate(userId, {
            onSuccess: () => {
                toast({
                    title: 'Password reset sent',
                    description: 'Password reset email has been sent to the user.',
                })
            },
            onError: (err) => {
                toast({ title: 'Error', description: err.message, variant: 'error' })
            },
        })
    }, [userId, sendPasswordReset, toast])

    const handleRevokeAllSessions = useCallback(() => {
        revokeAllSessions.mutate(userId, {
            onSuccess: () => {
                toast({
                    title: 'Sessions revoked',
                    description: 'All user sessions have been revoked.',
                })
            },
            onError: (err) => {
                toast({ title: 'Error', description: err.message, variant: 'error' })
            },
        })
    }, [userId, revokeAllSessions, toast])

    const handleDelete = useCallback(() => {
        deleteUser.mutate(userId, {
            onSuccess: () => {
                toast({ title: 'User deleted', description: 'User has been permanently deleted.' })
                router.push('/admin/users')
            },
            onError: (err) => {
                toast({ title: 'Error', description: err.message, variant: 'error' })
            },
        })
    }, [userId, deleteUser, toast, router])

    if (isError) {
        return (
            <div className="space-y-6">
                <Breadcrumb userName={null} />
                <Card className="border-destructive/50">
                    <CardContent className="py-8 text-center">
                        <p className="text-destructive">
                            Failed to load user: {error?.message ?? 'Unknown error'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Breadcrumb userName={user?.name ?? user?.email ?? null} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <UserDetail user={user} isLoading={isLoading} />
                </div>
                <div>
                    <UserActions
                        user={user}
                        onSuspend={handleSuspend}
                        onUnsuspend={handleUnsuspend}
                        onBan={handleBan}
                        onUnban={handleUnban}
                        onVerifyEmail={handleVerifyEmail}
                        onSendPasswordReset={handleSendPasswordReset}
                        onRevokeAllSessions={handleRevokeAllSessions}
                        onDelete={handleDelete}
                        isPending={isPending}
                    />
                </div>
            </div>
        </div>
    )
}

function Breadcrumb({ userName }: { userName: string | null }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Link href="/admin/users" className="text-text-light hover:text-text-dark">
                Users
            </Link>
            <span className="text-text-light">/</span>
            <span className="text-text-dark font-medium">{userName ?? 'User Details'}</span>
        </div>
    )
}
