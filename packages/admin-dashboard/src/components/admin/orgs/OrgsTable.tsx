'use client'

/**
 * OrgsTable Component
 *
 * Displays organizations in a table with:
 * - Name and slug
 * - Plan badge
 * - Status badge
 * - Member/app counts
 * - Last activity
 * - Actions dropdown
 */

import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell,
    Skeleton,
} from '@bundlenudge/shared-ui'
import { OrgRow } from './OrgRow'
import type { OrgsTableProps } from './types'

export function OrgsTable({
    organizations,
    isLoading,
    onOrgClick,
    onSuspend,
    onReactivate,
    pendingActions,
}: OrgsTableProps) {
    if (isLoading) {
        return <OrgsTableSkeleton />
    }

    if (organizations.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-text-light">No organizations match your filters</p>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">Organization</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Apps</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.map((org) => (
                        <OrgRow
                            key={org.id}
                            org={org}
                            onOrgClick={onOrgClick}
                            onSuspend={onSuspend}
                            onReactivate={onReactivate}
                            isPending={pendingActions.has(org.id)}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function OrgsTableSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">Organization</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Apps</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4">
                                <div>
                                    <Skeleton className="h-4 w-32 mb-1" />
                                    <Skeleton className="h-3 w-24 mb-1" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export type { OrgsTableProps }
