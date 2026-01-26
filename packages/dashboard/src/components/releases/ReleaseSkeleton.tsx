'use client'

/**
 * ReleaseSkeleton Components
 *
 * Loading skeletons for release table and detail views.
 */

import {
    Skeleton,
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui'

// =============================================================================
// Table Row Skeleton
// =============================================================================

function ReleaseTableRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-28" />
            </TableCell>
            <TableCell>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </TableCell>
        </TableRow>
    )
}

// =============================================================================
// Table Skeleton
// =============================================================================

interface ReleaseTableSkeletonProps {
    rowCount?: number
}

export function ReleaseTableSkeleton({ rowCount = 5 }: ReleaseTableSkeletonProps) {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Rollout</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rowCount }).map((_, index) => (
                        <ReleaseTableRowSkeleton key={index} />
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}

// =============================================================================
// Detail View Skeleton
// =============================================================================

export function ReleaseDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="space-y-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="space-y-1">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* History Card */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-20" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-48" />
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

// =============================================================================
// Card Skeleton (for grid view)
// =============================================================================

function ReleaseCardSkeleton() {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex items-center justify-between pt-3 border-t">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </CardContent>
        </Card>
    )
}

interface ReleaseCardGridSkeletonProps {
    count?: number
}

export function ReleaseCardGridSkeleton({ count = 6 }: ReleaseCardGridSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <ReleaseCardSkeleton key={index} />
            ))}
        </div>
    )
}
