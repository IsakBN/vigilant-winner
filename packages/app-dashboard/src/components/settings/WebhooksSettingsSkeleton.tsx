'use client'

/**
 * WebhooksSettingsSkeleton Component
 *
 * Loading skeleton for webhooks settings page.
 */

import {
    Skeleton,
    Card,
    CardContent,
    CardHeader,
} from '@bundlenudge/shared-ui'

export function WebhooksSettingsSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="mt-1 h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
            </Card>
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="mt-2 h-4 w-64" />
                        <div className="mt-2 flex gap-1">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
