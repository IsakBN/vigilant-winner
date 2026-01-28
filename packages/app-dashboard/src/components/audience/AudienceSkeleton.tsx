'use client'

/**
 * AudienceSkeleton Component
 *
 * Loading skeleton for the Audience page.
 */

import { Skeleton } from '@bundlenudge/shared-ui'

export function AudienceSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Action Bar Skeleton */}
            <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
            </div>

            {/* Table Skeleton */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-neutral-50 border-b px-4 py-3">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b px-4 py-3 last:border-b-0">
                        <div className="flex gap-4 items-center">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    )
}
