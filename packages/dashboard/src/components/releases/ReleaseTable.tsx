'use client'

import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Release, ReleaseStatus } from '@/lib/api/releases'

// =============================================================================
// Types
// =============================================================================

type SortField = 'version' | 'createdAt' | 'rolloutPercentage'
type SortOrder = 'asc' | 'desc'

interface ReleaseTableProps {
    releases: Release[]
    accountId: string
    appId: string
    sortBy?: SortField
    sortOrder?: SortOrder
    onSort?: (field: SortField) => void
}

// =============================================================================
// Helper Components
// =============================================================================

function StatusBadge({ status }: { status: ReleaseStatus }) {
    const config: Record<ReleaseStatus, { label: string; className: string }> = {
        active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
        rolling: { label: 'Rolling', className: 'bg-blue-100 text-blue-700 border-blue-200' },
        complete: { label: 'Complete', className: 'bg-green-100 text-green-700 border-green-200' },
        draft: { label: 'Draft', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
        disabled: { label: 'Disabled', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
        paused: { label: 'Paused', className: 'bg-amber-100 text-amber-700 border-amber-200' },
        failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
    }
    const { label, className } = config[status] ?? config.draft
    return <Badge className={cn('border text-xs', className)}>{label}</Badge>
}

function RolloutProgress({ percentage }: { percentage: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs font-mono text-neutral-500 w-10 text-right">
                {percentage}%
            </span>
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

function SortIcon({ field, sortBy, sortOrder }: { field: SortField; sortBy?: SortField; sortOrder?: SortOrder }) {
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
// Main Component
// =============================================================================

export function ReleaseTable({
    releases,
    accountId,
    appId,
    sortBy,
    sortOrder,
    onSort,
}: ReleaseTableProps) {
    const basePath = `/dashboard/${accountId}/apps/${appId}/releases`

    const handleSort = (field: SortField) => {
        if (onSort) {
            onSort(field)
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[120px]">
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
                    <TableHead>Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-medium hover:bg-transparent"
                            onClick={() => handleSort('rolloutPercentage')}
                        >
                            Rollout
                            <SortIcon field="rolloutPercentage" sortBy={sortBy} sortOrder={sortOrder} />
                        </Button>
                    </TableHead>
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
                {releases.map((release) => (
                    <TableRow
                        key={release.id}
                        className="cursor-pointer hover:bg-neutral-50"
                    >
                        <TableCell>
                            <Link
                                href={`${basePath}/${release.id}`}
                                className="font-mono text-sm font-medium text-neutral-900 hover:text-primary hover:underline"
                            >
                                v{release.version}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={release.status} />
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-neutral-600 capitalize">
                                {release.channel}
                            </span>
                        </TableCell>
                        <TableCell>
                            <RolloutProgress percentage={release.rolloutPercentage} />
                        </TableCell>
                        <TableCell className="text-right">
                            <span className="text-sm text-neutral-500">
                                {formatDate(release.createdAt)}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
