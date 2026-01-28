'use client'

/**
 * ReleaseDetailSkeleton - Loading state for release detail page.
 */

import { Skeleton } from '@bundlenudge/shared-ui'

export function ReleaseDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
            <Skeleton className="h-48 w-full" />
        </div>
    )
}
