'use client'

/**
 * AppSettingsSkeleton Component
 *
 * Loading skeleton for the app settings page.
 */

import {
    Card,
    CardContent,
    CardHeader,
    Skeleton,
} from '@bundlenudge/shared-ui'

export function AppSettingsSkeleton() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-5 w-64" />
            </div>

            {/* General Settings Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>

            {/* API Key Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-72 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-28" />
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-4 w-80 mt-1" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-full max-w-md mt-2" />
                        </div>
                        <Skeleton className="h-10 w-28" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
