'use client'

/**
 * TestingToolsSkeleton Component
 *
 * Loading skeleton for the testing tools page.
 */

import {
    Skeleton,
    Card,
    CardContent,
    CardHeader,
} from '@bundlenudge/shared-ui'

// =============================================================================
// Form Card Skeleton
// =============================================================================

function FormCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Result Card Skeleton
// =============================================================================

function ResultCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Table Skeleton
// =============================================================================

function TableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-[120px]" />
                        <Skeleton className="h-8 w-[140px]" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="border-t">
                    {/* Table Header */}
                    <div className="flex items-center gap-4 px-4 py-3 border-b bg-neutral-50/50">
                        {[80, 100, 60, 80, 60, 60, 40].map((width, i) => (
                            <Skeleton key={i} className="h-4" style={{ width }} />
                        ))}
                    </div>
                    {/* Table Rows */}
                    {[1, 2, 3, 4, 5].map((row) => (
                        <div key={row} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                            <div className="flex items-center gap-2" style={{ width: 80 }}>
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-14" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-14" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Component
// =============================================================================

export function TestingToolsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-7 w-40" />
            </div>

            {/* Debug Mode Toggle */}
            <Card>
                <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                </CardContent>
            </Card>

            {/* Form Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormCardSkeleton />
                <FormCardSkeleton />
            </div>

            {/* Recent Result */}
            <ResultCardSkeleton />

            {/* History Table */}
            <TableSkeleton />
        </div>
    )
}
