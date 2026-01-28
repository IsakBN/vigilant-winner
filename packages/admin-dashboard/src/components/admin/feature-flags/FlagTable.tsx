'use client'

/**
 * FlagTable Component
 *
 * Displays feature flags in a table with:
 * - Name, key, type, status
 * - Toggle switch for enabling/disabling
 * - Edit and delete actions
 */

import { Pencil, Trash2, Loader2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Switch,
    Button,
    Skeleton,
} from '@bundlenudge/shared-ui'
import type { FeatureFlag } from '@/lib/api/types'

export interface FlagTableProps {
    flags: FeatureFlag[]
    isLoading: boolean
    onToggle: (flagId: string, enabled: boolean) => void
    onEdit: (flag: FeatureFlag) => void
    onDelete: (flag: FeatureFlag) => void
    togglingIds: Set<string>
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function getTypeBadgeVariant(type: FeatureFlag['type']) {
    switch (type) {
        case 'boolean':
            return 'default'
        case 'percentage':
            return 'secondary'
        case 'json':
            return 'outline'
        default:
            return 'default'
    }
}

export function FlagTable({
    flags,
    isLoading,
    onToggle,
    onEdit,
    onDelete,
    togglingIds,
}: FlagTableProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Rollout</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-center">Enabled</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={String(i)}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-9 mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    if (flags.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-text-light">No feature flags found.</p>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rollout</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-center">Enabled</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {flags.map((flag) => {
                        const isToggling = togglingIds.has(flag.id)
                        return (
                            <TableRow key={flag.id}>
                                <TableCell className="font-medium">
                                    <div>
                                        <div className="text-text-dark">{flag.name}</div>
                                        {flag.description && (
                                            <div className="text-xs text-text-light truncate max-w-[180px]">
                                                {flag.description}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {flag.key}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getTypeBadgeVariant(flag.type)}>
                                        {flag.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {flag.type === 'percentage'
                                        ? `${String(flag.rolloutPercentage)}%`
                                        : '-'}
                                </TableCell>
                                <TableCell className="text-text-light text-sm">
                                    {formatDate(flag.createdAt)}
                                </TableCell>
                                <TableCell className="text-center">
                                    {isToggling ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : (
                                        <Switch
                                            checked={flag.enabled}
                                            onCheckedChange={(checked) => onToggle(flag.id, checked)}
                                            aria-label={`Toggle ${flag.name}`}
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(flag)}
                                            title="Edit flag"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(flag)}
                                            title="Delete flag"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
