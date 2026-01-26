'use client'

/**
 * Profile Settings Page
 *
 * User profile management including name, email, and password.
 */

import { useParams } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { ProfileForm } from '@/components/settings'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDeleteAccount } from '@/hooks/useSettings'

export default function ProfileSettingsPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const { isLoading, logout } = useAuth()
    const deleteAccount = useDeleteAccount(accountId)

    const handleDeleteAccount = async () => {
        await deleteAccount.mutateAsync()
        void logout()
    }

    if (isLoading) {
        return <SettingsPageSkeleton />
    }

    return (
        <div className="space-y-6">
            <ProfileForm accountId={accountId} />

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Irreversible and destructive actions
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all data
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete your account, all your
                                    apps, releases, and remove all data from
                                    our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {deleteAccount.isPending
                                        ? 'Deleting...'
                                        : 'Delete Account'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    )
}

function SettingsPageSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-60" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
}
