/**
 * IntegrationsSettingsSkeleton Component
 *
 * Loading state for the integrations settings page.
 */

import {
    Card,
    CardHeader,
    Skeleton,
} from '@bundlenudge/shared-ui'

export function IntegrationsSettingsSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-60" />
                </CardHeader>
            </Card>
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div>
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="mt-1 h-4 w-40" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
