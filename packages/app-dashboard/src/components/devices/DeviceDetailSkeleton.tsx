'use client'

/**
 * DeviceDetailSkeleton Component
 *
 * Loading skeleton for the device detail page.
 */

import {
    Skeleton,
    Card,
    CardContent,
    CardHeader,
} from '@bundlenudge/shared-ui'

export function DeviceDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-start justify-between">
                <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>
                <Skeleton className="h-9 w-28" />
            </div>

            {/* Device Info Card Skeleton */}
            <Card>
                <CardHeader className="pb-4">
                    <Skeleton className="h-5 w-36" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="space-y-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-5 w-28" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Current Release Card Skeleton */}
            <Card>
                <CardHeader className="pb-4">
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline Card Skeleton */}
            <Card>
                <CardHeader className="pb-4">
                    <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b border-border last:border-0"
                            >
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Update History Card Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex gap-3 py-3 border-b border-border last:border-0">
                                <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
