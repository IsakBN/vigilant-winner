'use client'

/**
 * BillingSettingsSkeleton Component
 *
 * Loading skeleton for the billing settings page.
 */

import {
    Card,
    CardContent,
    CardHeader,
    Skeleton,
} from '@bundlenudge/shared-ui'

export function BillingSettingsSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-12 w-40" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
