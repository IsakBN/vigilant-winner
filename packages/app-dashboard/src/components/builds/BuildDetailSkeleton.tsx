'use client'

/**
 * BuildDetailSkeleton Component
 *
 * Loading state for the build detail page.
 */

import { Card, CardContent, Skeleton } from '@bundlenudge/shared-ui'

export function BuildDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
                <Skeleton className="h-9 w-24" />
            </div>

            {/* Timeline skeleton */}
            <div className="flex items-center justify-between py-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-3 w-16 mt-2" />
                        </div>
                        {i < 4 && <Skeleton className="flex-1 h-0.5 mx-2" />}
                    </div>
                ))}
            </div>

            {/* Info card skeleton */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <Skeleton className="h-3 w-16 mb-2" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Logs skeleton */}
            <Card>
                <CardContent className="p-0">
                    <div className="h-[400px] bg-neutral-900 rounded-lg p-4 space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-4 w-20 bg-neutral-800" />
                                <Skeleton className="h-4 w-4 bg-neutral-800" />
                                <Skeleton
                                    className="h-4 bg-neutral-800"
                                    style={{ width: `${String(40 + i * 5)}%` }}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
