'use client'

/**
 * OrgDetailModal Component
 *
 * Main modal wrapper for viewing and managing organization details.
 * Uses tabs to organize content into Overview, Members, and Actions.
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
import { useAdminOrg } from '@/hooks/useAdminOrgs'
import { OrgOverviewTab } from './OrgOverviewTab'
import { OrgMembersTab } from './OrgMembersTab'
import { OrgActionsTab } from './OrgActionsTab'
import type { OrgDetailModalProps } from './types'

export function OrgDetailModal({
    orgId,
    open,
    onClose,
    onOrgUpdated,
}: OrgDetailModalProps) {
    const { organization, isLoading, isError, error, refetch } = useAdminOrg(orgId ?? '')

    function handleClose() {
        onClose()
    }

    function handleRefresh() {
        void refetch()
    }

    const memberCount = organization?.members?.length ?? organization?.memberCount ?? 0
    const _appCount = organization?.apps?.length ?? organization?.appCount ?? 0

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Organization Details</DialogTitle>
                    <DialogDescription>
                        {organization?.name ?? 'Loading...'}
                    </DialogDescription>
                </DialogHeader>

                {/* Error State */}
                {isError && (
                    <ErrorAlert message={error?.message ?? 'Failed to load organization'} />
                )}

                {/* Loading State */}
                {isLoading ? (
                    <LoadingSkeleton />
                ) : organization ? (
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="members">
                                Members ({String(memberCount)})
                            </TabsTrigger>
                            <TabsTrigger value="actions">Actions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <OrgOverviewTab
                                organization={organization}
                                onRefresh={handleRefresh}
                            />
                        </TabsContent>

                        <TabsContent value="members">
                            <OrgMembersTab
                                organization={organization}
                                onRefresh={handleRefresh}
                            />
                        </TabsContent>

                        <TabsContent value="actions">
                            <OrgActionsTab
                                organization={organization}
                                onRefresh={handleRefresh}
                                onOrgUpdated={onOrgUpdated}
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
