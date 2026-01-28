'use client'

/**
 * UserDetailModal Component
 *
 * Main modal wrapper for viewing and managing user details.
 * Uses tabs to organize content into Overview, Apps, Teams, and Actions.
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Skeleton,
} from '@bundlenudge/shared-ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminUser } from '@/hooks/useAdminUsers'
import { UserOverviewTab } from './UserOverviewTab'
import { UserAppsTab } from './UserAppsTab'
import { UserTeamsTab } from './UserTeamsTab'
import { UserActionsTab } from './UserActionsTab'
import type { UserDetailModalProps } from './types'

export function UserDetailModal({
    userId,
    open,
    onClose,
    onUserUpdated,
}: UserDetailModalProps) {
    const { user, isLoading, isError, error, refetch } = useAdminUser(userId ?? '')

    function handleClose() {
        onClose()
    }

    function handleRefresh() {
        void refetch()
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>
                        {user?.email ?? 'Loading...'}
                    </DialogDescription>
                </DialogHeader>

                {/* Error State */}
                {isError && (
                    <ErrorAlert message={error?.message ?? 'Failed to load user details'} />
                )}

                {/* Loading State */}
                {isLoading ? (
                    <LoadingSkeleton />
                ) : user ? (
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="apps">
                                Apps ({String(user.appsCount ?? 0)})
                            </TabsTrigger>
                            <TabsTrigger value="teams">
                                Teams ({String(user.teamsCount ?? 0)})
                            </TabsTrigger>
                            <TabsTrigger value="actions">Actions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <UserOverviewTab user={user} onRefresh={handleRefresh} />
                        </TabsContent>

                        <TabsContent value="apps">
                            <UserAppsTab user={user} onRefresh={handleRefresh} />
                        </TabsContent>

                        <TabsContent value="teams">
                            <UserTeamsTab user={user} onRefresh={handleRefresh} />
                        </TabsContent>

                        <TabsContent value="actions">
                            <UserActionsTab
                                user={user}
                                onRefresh={handleRefresh}
                                onUserUpdated={onUserUpdated}
                            />
                        </TabsContent>
                    </Tabs>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Sub-components

interface ErrorAlertProps {
    message: string
}

function ErrorAlert({ message }: ErrorAlertProps) {
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {message}
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    )
}
