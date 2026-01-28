'use client'

/**
 * TeamSettingsSkeleton Component
 *
 * Loading skeleton for the team settings page.
 */

import {
    Skeleton,
    Card,
    CardContent,
    CardHeader,
} from '@bundlenudge/shared-ui'

export function TeamSettingsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-2" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-2" />
                <Skeleton className="h-4 w-16" />
            </div>

            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-56" />
            </div>

            {/* General settings card skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-11 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-11 w-full" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-9 w-28" />
                    </div>
                </CardContent>
            </Card>

            {/* Danger zone card skeleton */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-px w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                </CardContent>
            </Card>
        </div>
    )
}
