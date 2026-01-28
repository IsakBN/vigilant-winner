'use client'

/**
 * TesterTable Component
 *
 * Displays a table of testers with actions.
 */

import { Trash2 } from 'lucide-react'
import {
    Card,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Button,
} from '@bundlenudge/shared-ui'
import type { Tester } from '@/lib/api'

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${String(minutes)}m ago`
    if (hours < 24) return `${String(hours)}h ago`
    if (days < 7) return `${String(days)}d ago`

    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })
}

// =============================================================================
// Types
// =============================================================================

interface TesterTableProps {
    testers: Tester[]
    onDelete: (testerId: string) => void
    isDeleting: boolean
}

// =============================================================================
// Component
// =============================================================================

export function TesterTable({ testers, onDelete, isDeleting }: TesterTableProps) {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Emails Sent</TableHead>
                        <TableHead>Last Notified</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {testers.map((tester) => (
                        <TableRow key={tester.id}>
                            <TableCell className="font-medium text-neutral-900">
                                {tester.email}
                            </TableCell>
                            <TableCell className="text-neutral-600">
                                {tester.name ?? '-'}
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-neutral-500">
                                    {tester.stats?.totalSent ?? 0}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm text-neutral-500">
                                {tester.stats?.lastSentAt
                                    ? formatRelativeTime(tester.stats.lastSentAt)
                                    : 'Never'}
                            </TableCell>
                            <TableCell className="text-sm text-neutral-500">
                                {formatRelativeTime(tester.createdAt)}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(tester.id)}
                                    disabled={isDeleting}
                                    className="text-neutral-400 hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}
