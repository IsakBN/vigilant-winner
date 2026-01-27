'use client'

/**
 * OrgTableSkeleton Component
 *
 * Loading skeleton for the organization table.
 */

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Skeleton,
} from '@/components/ui'

export function OrgTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[160px]" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Apps</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-8 ml-auto" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-4 w-8 ml-auto" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-8 w-20 ml-auto" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
