'use client'

/**
 * UsageSettingsSkeleton Component
 *
 * Loading state skeleton for the usage settings page.
 */

import {
    Card,
    CardContent,
    CardHeader,
    Skeleton,
} from '@bundlenudge/shared-ui'

export function UsageSettingsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Usage Chart Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bandwidth Card Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="mt-1 h-4 w-36" />
                </CardContent>
            </Card>

            {/* Billing Period Card Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-52" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div>
                            <Skeleton className="h-4 w-10" />
                            <Skeleton className="mt-1 h-5 w-24" />
                        </div>
                        <div className="h-px flex-1 bg-border" />
                        <div className="text-right">
                            <Skeleton className="ml-auto h-4 w-10" />
                            <Skeleton className="mt-1 h-5 w-24" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
