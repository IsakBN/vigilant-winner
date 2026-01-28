'use client'

/**
 * InvitationsPageSkeleton Component
 *
 * Loading skeleton for the team invitations page.
 */

import { Skeleton, Card, CardContent, CardHeader } from '@bundlenudge/shared-ui'

export function InvitationsPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-96" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invite Form Card Skeleton */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64 mt-1" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>

                {/* Pending Invitations Card Skeleton */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-72 mt-1" />
                    </CardHeader>
                    <CardContent>
                        <InvitationsTableSkeleton />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

/**
 * Skeleton for the invitations table content
 */
function InvitationsTableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
    )
}
