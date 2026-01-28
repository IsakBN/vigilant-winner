'use client'

/**
 * DeviceTableSkeleton Component
 *
 * Loading skeleton for the device table.
 */

import {
    Skeleton,
    Card,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@bundlenudge/shared-ui'

// =============================================================================
// Table Row Skeleton
// =============================================================================

function DeviceTableRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
            </TableCell>
        </TableRow>
    )
}

// =============================================================================
// Table Skeleton
// =============================================================================

interface DeviceTableSkeletonProps {
    rowCount?: number
}

export function DeviceTableSkeleton({ rowCount = 5 }: DeviceTableSkeletonProps) {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>OS Version</TableHead>
                        <TableHead>App Version</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rowCount }).map((_, index) => (
                        <DeviceTableRowSkeleton key={index} />
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}
