'use client'

/**
 * ReleasesListSkeleton Component
 *
 * Loading skeleton for the releases list page.
 */

import { Skeleton } from '@bundlenudge/shared-ui'

export function ReleasesListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Filter bar skeleton */}
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Table skeleton */}
            <Skeleton className="h-64 w-full" />
        </div>
    )
}
