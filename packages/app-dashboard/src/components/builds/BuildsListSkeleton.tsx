'use client'

/**
 * BuildsListSkeleton Component
 *
 * Loading skeleton for the builds list page.
 */

import { Skeleton } from '@bundlenudge/shared-ui'

export function BuildsListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* Filters skeleton */}
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Table skeleton */}
            <div className="border rounded-lg">
                <div className="border-b p-4">
                    <div className="flex items-center gap-8">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24 ml-auto" />
                    </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b last:border-b-0 p-4">
                        <div className="flex items-center gap-8">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-28 ml-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
