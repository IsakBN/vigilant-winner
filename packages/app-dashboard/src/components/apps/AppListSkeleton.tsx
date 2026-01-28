'use client'

/**
 * AppListSkeleton Component
 *
 * Loading skeleton for the apps grid.
 */

import { Skeleton, Card, CardContent } from '@bundlenudge/shared-ui'

interface AppCardSkeletonProps {
    className?: string
}

function AppCardSkeleton({ className }: AppCardSkeletonProps) {
    return (
        <Card className={className}>
            <CardContent className="p-5">
                {/* Header: Icon and Badge */}
                <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <Skeleton className="w-16 h-5 rounded-md" />
                </div>

                {/* App Name */}
                <Skeleton className="h-6 w-3/4 mb-2" />

                {/* Bundle ID */}
                <Skeleton className="h-4 w-1/2 mb-4" />

                {/* Stats Row */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </CardContent>
        </Card>
    )
}

interface AppListSkeletonProps {
    count?: number
}

export function AppListSkeleton({ count = 6 }: AppListSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <AppCardSkeleton key={index} />
            ))}
        </div>
    )
}
