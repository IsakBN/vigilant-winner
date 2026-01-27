'use client'

/**
 * AuditLogTable Component
 *
 * Displays system-wide audit logs in a table format with actions and metadata.
 */

import { ClipboardList } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared'
import type { AuditLogEntry, AuditAction } from '@/lib/api'

interface AuditLogTableProps {
    logs: AuditLogEntry[]
    isLoading?: boolean
}

/**
 * Format action for display
 */
function formatAction(action: AuditAction): string {
    const actionMap: Record<AuditAction, string> = {
        'config.update': 'Config Updated',
        'user.create': 'User Created',
        'user.update': 'User Updated',
        'user.delete': 'User Deleted',
        'user.suspend': 'User Suspended',
        'user.unsuspend': 'User Unsuspended',
        'app.create': 'App Created',
        'app.delete': 'App Deleted',
        'release.create': 'Release Created',
        'release.rollback': 'Release Rollback',
        'team.create': 'Team Created',
        'team.delete': 'Team Deleted',
        'admin.login': 'Admin Login',
        'admin.logout': 'Admin Logout',
    }
    return actionMap[action] || action
}

/**
 * Get badge variant based on action type
 */
function getActionVariant(
    action: AuditAction
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (action.includes('delete') || action.includes('suspend')) {
        return 'destructive'
    }
    if (action.includes('create')) {
        return 'default'
    }
    if (action.includes('login') || action.includes('logout')) {
        return 'secondary'
    }
    return 'outline'
}

/**
 * Format date for display
 */
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Loading skeleton for table
 */
function AuditLogTableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-28" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
    if (isLoading) {
        return <AuditLogTableSkeleton />
    }

    if (logs.length === 0) {
        return (
            <EmptyState
                icon={ClipboardList}
                title="No audit logs found"
                variant="minimal"
            />
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell>
                            <Badge variant={getActionVariant(log.action)}>
                                {formatAction(log.action)}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {log.actorName || 'Unknown'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {log.actorEmail}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {log.targetType && (
                                <div className="flex flex-col">
                                    <span className="capitalize">
                                        {log.targetType}
                                    </span>
                                    {log.targetName && (
                                        <span className="text-xs text-muted-foreground">
                                            {log.targetName}
                                        </span>
                                    )}
                                </div>
                            )}
                            {!log.targetType && (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {log.ipAddress || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {formatDate(log.createdAt)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
