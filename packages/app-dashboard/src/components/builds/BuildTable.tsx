'use client'

/**
 * BuildTable Component
 *
 * Displays builds in a sortable table format.
 */

import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Button,
} from '@bundlenudge/shared-ui'
import { PlatformBadge } from '@/components/apps/PlatformBadge'
import { BuildStatusBadge } from './BuildStatusBadge'
import type { Build } from '@/lib/api/builds'

// =============================================================================
// Types
// =============================================================================

export type SortField = 'createdAt' | 'version' | 'status'
export type SortOrder = 'asc' | 'desc'

interface BuildTableProps {
    builds: Build[]
    accountId: string
    appId: string
    sortBy?: SortField
    sortOrder?: SortOrder
    onSort?: (field: SortField) => void
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatDuration(startMs: number | null, endMs: number | null): string {
    if (!startMs) return '-'
    const end = endMs ?? Date.now()
    const seconds = Math.floor((end - startMs) / 1000)

    if (seconds < 60) return `${String(seconds)}s`

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${String(minutes)}m ${String(remainingSeconds)}s`
}

function formatSize(bytes: number | null): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${String(bytes)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// =============================================================================
// Helper Components
// =============================================================================

function SortIcon({
    field,
    sortBy,
    sortOrder,
}: {
    field: SortField
    sortBy?: SortField
    sortOrder?: SortOrder
}) {
    if (sortBy !== field) {
        return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
    }
    return sortOrder === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
        <ArrowDown className="w-3.5 h-3.5 text-primary" />
    )
}

// =============================================================================
// Component
// =============================================================================

export function BuildTable({
    builds,
    accountId,
    appId,
    sortBy,
    sortOrder,
    onSort,
}: BuildTableProps) {
    const basePath = `/dashboard/${accountId}/apps/${appId}/builds`

    const handleSort = (field: SortField) => {
        if (onSort) {
            onSort(field)
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-medium hover:bg-transparent"
                            onClick={() => handleSort('version')}
                        >
                            Version
                            <SortIcon field="version" sortBy={sortBy} sortOrder={sortOrder} />
                        </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">Platform</TableHead>
                    <TableHead className="w-[120px]">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-medium hover:bg-transparent"
                            onClick={() => handleSort('status')}
                        >
                            Status
                            <SortIcon field="status" sortBy={sortBy} sortOrder={sortOrder} />
                        </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">Size</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="text-right">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-medium hover:bg-transparent"
                            onClick={() => handleSort('createdAt')}
                        >
                            Created
                            <SortIcon field="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
                        </Button>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {builds.map((build) => (
                    <TableRow key={build.id} className="cursor-pointer hover:bg-neutral-50">
                        <TableCell>
                            <Link
                                href={`${basePath}/${build.id}`}
                                className="font-mono text-sm font-medium text-neutral-900 hover:text-primary hover:underline"
                            >
                                v{build.version}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <PlatformBadge platform={build.platform} />
                        </TableCell>
                        <TableCell>
                            <BuildStatusBadge status={build.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600 font-mono">
                            {formatSize(build.bundleSize)}
                        </TableCell>
                        <TableCell className="text-sm text-neutral-500">
                            {formatDuration(build.startedAt, build.completedAt)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-neutral-500">
                            {formatDate(build.createdAt)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
