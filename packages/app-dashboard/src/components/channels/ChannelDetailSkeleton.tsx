'use client'

/**
 * ChannelDetailSkeleton Component
 *
 * Loading state skeleton for the channel detail page.
 */

import { Card, CardContent, Skeleton } from '@bundlenudge/shared-ui'

export function ChannelDetailSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>

            {/* Settings card skeleton */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>

            {/* Rollout card skeleton */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                </CardContent>
            </Card>

            {/* Targeting rules skeleton */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
