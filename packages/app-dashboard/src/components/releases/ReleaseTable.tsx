'use client'

/**
 * ReleaseTable Component
 *
 * Displays releases in a sortable table format with version, status,
 * channel, rollout percentage, and creation date.
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
    cn,
} from '@bundlenudge/shared-ui'
import { ReleaseStatusBadge, type ReleaseStatus } from './ReleaseStatusBadge'

// =============================================================================
// Types
// =============================================================================

export type SortField = 'version' | 'createdAt' | 'rolloutPercentage'
export type SortOrder = 'asc' | 'desc'

export interface Release {
    id: string
    version: string
    status: ReleaseStatus
    channel: string
    rolloutPercentage: number
    createdAt: number
}

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

function RolloutProgress({ percentage }: { percentage: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${String(percentage)}%` }}
                />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-10 text-right">
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

interface SortIconProps {
    field: SortField
    sortBy?: SortField
    sortOrder?: SortOrder
}

function SortIcon({ field, sortBy, sortOrder }: SortIconProps) {
    if (sortBy !== field) {
        return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
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
                            <SortIcon
                                field="rolloutPercentage"
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                            />
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
                                className={cn(
                                    'font-mono text-sm font-medium',
                                    'text-neutral-900 hover:text-primary hover:underline'
                                )}
                            >
                                v{release.version}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <ReleaseStatusBadge status={release.status} />
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-muted-foreground capitalize">
                                {release.channel}
                            </span>
                        </TableCell>
                        <TableCell>
                            <RolloutProgress percentage={release.rolloutPercentage} />
                        </TableCell>
                        <TableCell className="text-right">
                            <span className="text-sm text-muted-foreground">
                                {formatDate(release.createdAt)}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
