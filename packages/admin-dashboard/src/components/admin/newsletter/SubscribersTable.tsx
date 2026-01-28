'use client'

/**
 * SubscribersTable Component
 *
 * Displays newsletter subscribers in a table with:
 * - Email, name
 * - Status badges (active/unsubscribed)
 * - Subscribed date
 * - Source
 */

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Skeleton,
} from '@bundlenudge/shared-ui'
import type { NewsletterSubscriber } from '@/lib/api/types'

export interface SubscribersTableProps {
    subscribers: NewsletterSubscriber[]
    isLoading: boolean
}

export function SubscribersTable({ subscribers, isLoading }: SubscribersTableProps) {
    if (isLoading) {
        return <SubscribersTableSkeleton />
    }

    if (subscribers.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-text-light">No subscribers match your filters</p>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscribed</TableHead>
                        <TableHead>Source</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                            <TableCell className="px-4 font-medium text-text-dark">
                                {subscriber.email}
                            </TableCell>
                            <TableCell className="text-text-dark">
                                {subscriber.name ?? '-'}
                            </TableCell>
                            <TableCell>
                                <StatusBadge isActive={subscriber.isActive} />
                            </TableCell>
                            <TableCell className="text-text-light text-sm">
                                {formatDate(subscriber.subscribedAt)}
                            </TableCell>
                            <TableCell className="text-text-light text-sm">
                                {subscriber.source ?? 'Website'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

interface StatusBadgeProps {
    isActive: boolean
}

function StatusBadge({ isActive }: StatusBadgeProps) {
    if (isActive) {
        return (
            <Badge className="bg-green-100 text-green-700">
                Active
            </Badge>
        )
    }

    return (
        <Badge className="bg-gray-100 text-gray-700">
            Unsubscribed
        </Badge>
    )
}

function SubscribersTableSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscribed</TableHead>
                        <TableHead>Source</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4">
                                <Skeleton className="h-4 w-48" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-6 w-16" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-20" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-16" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
