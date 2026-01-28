'use client'

/**
 * ReleaseTable Component
 *
 * Displays releases in a polished sortable table with version, status,
 * channel, rollout progress, downloads, and quick actions.
 */

import Link from 'next/link'
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Download,
    Eye,
    Pause,
    Play,
    MoreHorizontal,
    Hash,
} from 'lucide-react'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReleaseStatusBadge, type ReleaseStatus } from './ReleaseStatusBadge'

// =============================================================================
// Types
// =============================================================================

export type SortField = 'version' | 'createdAt' | 'rolloutPercentage' | 'downloads'
export type SortOrder = 'asc' | 'desc'

export interface Release {
    id: string
    version: string
    status: ReleaseStatus
    channel: string
    rolloutPercentage: number
    createdAt: number
    downloads?: number
}

interface ReleaseTableProps {
    releases: Release[]
    accountId: string
    appId: string
    sortBy?: SortField
    sortOrder?: SortOrder
    onSort?: (field: SortField) => void
    onPause?: (releaseId: string) => void
    onResume?: (releaseId: string) => void
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 30) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }
    if (days > 0) return `${String(days)}d ago`
    if (hours > 0) return `${String(hours)}h ago`
    if (minutes > 0) return `${String(minutes)}m ago`
    return 'just now'
}

function formatDownloads(count: number): string {
    if (count >= 1_000_000) {
        return `${(count / 1_000_000).toFixed(1)}M`
    }
    if (count >= 1_000) {
        return `${(count / 1_000).toFixed(1)}K`
    }
    return String(count)
}

function getRolloutColor(percentage: number, status: ReleaseStatus): string {
    if (status === 'paused') return 'bg-amber-400'
    if (status === 'failed') return 'bg-red-400'
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 50) return 'bg-blue-500'
    return 'bg-blue-400'
}

// =============================================================================
// Helper Components
// =============================================================================

interface RolloutProgressProps {
    percentage: number
    status: ReleaseStatus
}

function RolloutProgress({ percentage, status }: RolloutProgressProps) {
    const barColor = getRolloutColor(percentage, status)

    return (
        <div className="flex items-center gap-3 min-w-[120px]">
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full transition-all duration-500 ease-out rounded-full',
                        barColor
                    )}
                    style={{ width: `${String(percentage)}%` }}
                />
            </div>
            <span
                className={cn(
                    'text-xs font-mono font-medium w-10 text-right',
                    percentage === 100 ? 'text-green-600' : 'text-muted-foreground'
                )}
            >
                {percentage}%
            </span>
        </div>
    )
}

interface SortIconProps {
    field: SortField
    sortBy?: SortField
    sortOrder?: SortOrder
}

function SortIcon({ field, sortBy, sortOrder }: SortIconProps) {
    if (sortBy !== field) {
        return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
    }
    return sortOrder === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
        <ArrowDown className="w-3.5 h-3.5 text-primary" />
    )
}

interface ChannelBadgeProps {
    channel: string
}

function ChannelBadge({ channel }: ChannelBadgeProps) {
    const channelColors: Record<string, string> = {
        production: 'bg-purple-100 text-purple-700',
        staging: 'bg-blue-100 text-blue-700',
        beta: 'bg-orange-100 text-orange-700',
        alpha: 'bg-yellow-100 text-yellow-700',
        development: 'bg-neutral-100 text-neutral-700',
    }

    const colorClass = channelColors[channel.toLowerCase()] ?? 'bg-neutral-100 text-neutral-600'

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                colorClass
            )}
        >
            <Hash className="w-3 h-3" />
            {channel}
        </span>
    )
}

interface QuickActionsProps {
    release: Release
    basePath: string
    onPause?: (releaseId: string) => void
    onResume?: (releaseId: string) => void
}

function QuickActions({ release, basePath, onPause, onResume }: QuickActionsProps) {
    const canPause = release.status === 'active' || release.status === 'rolling'
    const canResume = release.status === 'paused'

    return (
        <div className="flex items-center justify-end gap-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                asChild
            >
                <Link href={`${basePath}/${release.id}`} title="View Details">
                    <Eye className="w-4 h-4" />
                </Link>
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                        <Link
                            href={`${basePath}/${release.id}`}
                            className="flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            View Details
                        </Link>
                    </DropdownMenuItem>
                    {(canPause || canResume) && <DropdownMenuSeparator />}
                    {canPause && onPause && (
                        <DropdownMenuItem
                            onClick={() => onPause(release.id)}
                            className="flex items-center gap-2 text-amber-600"
                        >
                            <Pause className="w-4 h-4" />
                            Pause Rollout
                        </DropdownMenuItem>
                    )}
                    {canResume && onResume && (
                        <DropdownMenuItem
                            onClick={() => onResume(release.id)}
                            className="flex items-center gap-2 text-green-600"
                        >
                            <Play className="w-4 h-4" />
                            Resume Rollout
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
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
    onPause,
    onResume,
}: ReleaseTableProps) {
    const basePath = `/dashboard/${accountId}/apps/${appId}/releases`

    const handleSort = (field: SortField) => {
        if (onSort) {
            onSort(field)
        }
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[130px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 font-semibold hover:bg-transparent text-neutral-700"
                                onClick={() => handleSort('version')}
                            >
                                Version
                                <SortIcon field="version" sortBy={sortBy} sortOrder={sortOrder} />
                            </Button>
                        </TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[120px]">Channel</TableHead>
                        <TableHead className="w-[160px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 font-semibold hover:bg-transparent text-neutral-700"
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
                        <TableHead className="w-[100px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 font-semibold hover:bg-transparent text-neutral-700"
                                onClick={() => handleSort('downloads')}
                            >
                                <Download className="w-3.5 h-3.5 mr-1" />
                                Downloads
                                <SortIcon field="downloads" sortBy={sortBy} sortOrder={sortOrder} />
                            </Button>
                        </TableHead>
                        <TableHead className="w-[100px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 font-semibold hover:bg-transparent text-neutral-700"
                                onClick={() => handleSort('createdAt')}
                            >
                                Created
                                <SortIcon field="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
                            </Button>
                        </TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {releases.map((release) => (
                        <TableRow
                            key={release.id}
                            className="group cursor-pointer hover:bg-neutral-50/80 transition-colors"
                        >
                            <TableCell>
                                <Link
                                    href={`${basePath}/${release.id}`}
                                    className={cn(
                                        'inline-flex items-center gap-1.5',
                                        'font-mono text-sm font-semibold',
                                        'text-neutral-900 hover:text-primary',
                                        'transition-colors'
                                    )}
                                >
                                    <span className="text-neutral-400">v</span>
                                    {release.version}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <ReleaseStatusBadge status={release.status} />
                            </TableCell>
                            <TableCell>
                                <ChannelBadge channel={release.channel} />
                            </TableCell>
                            <TableCell>
                                <RolloutProgress
                                    percentage={release.rolloutPercentage}
                                    status={release.status}
                                />
                            </TableCell>
                            <TableCell>
                                <span
                                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                                    title={`${(release.downloads ?? 0).toLocaleString()} downloads`}
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    {formatDownloads(release.downloads ?? 0)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span
                                    className="text-sm text-muted-foreground"
                                    title={new Date(release.createdAt).toLocaleString()}
                                >
                                    {formatRelativeTime(release.createdAt)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <QuickActions
                                    release={release}
                                    basePath={basePath}
                                    onPause={onPause}
                                    onResume={onResume}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
