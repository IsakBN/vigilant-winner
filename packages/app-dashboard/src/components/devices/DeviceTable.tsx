'use client'

/**
 * DeviceTable Component
 *
 * Displays a table of devices with pagination.
 */

import Link from 'next/link'
import { Smartphone, Monitor, Ban, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import {
    Card,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Button,
    cn,
} from '@bundlenudge/shared-ui'
import type { Device } from '@/hooks'

// =============================================================================
// Types
// =============================================================================

interface DeviceTableProps {
    devices: Device[]
    appId: string
    accountId: string
    pagination?: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
    }
    onPageChange?: (offset: number) => void
}

// =============================================================================
// Helpers
// =============================================================================

function getRelativeTime(timestamp: number | null): string {
    if (!timestamp) return 'Never'
    const now = Date.now()
    const diff = now - timestamp * 1000
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${String(minutes)}m ago`
    if (hours < 24) return `${String(hours)}h ago`
    return `${String(days)}d ago`
}

function truncateId(id: string, length = 16): string {
    if (id.length <= length) return id
    return `${id.slice(0, length)}...`
}

// =============================================================================
// Platform Badge
// =============================================================================

function PlatformBadge({ platform }: { platform: string }) {
    const isIos = platform === 'ios'
    return (
        <Badge
            variant="secondary"
            className={cn(
                'text-xs capitalize',
                isIos ? 'bg-neutral-100 text-neutral-800' : 'bg-green-100 text-green-800'
            )}
        >
            {isIos ? (
                <Smartphone className="w-3 h-3 mr-1" />
            ) : (
                <Monitor className="w-3 h-3 mr-1" />
            )}
            {platform}
        </Badge>
    )
}

// =============================================================================
// Table Row
// =============================================================================

interface DeviceRowProps {
    device: Device
    appId: string
    accountId: string
}

function DeviceRow({ device, appId, accountId }: DeviceRowProps) {
    const isRevoked = Boolean(device.revokedAt)
    const deviceUrl = `/dashboard/${accountId}/apps/${appId}/devices/${device.id}`

    return (
        <TableRow className={cn(isRevoked && 'opacity-60')}>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">
                        {device.deviceModel || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                        {truncateId(device.deviceId)}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <PlatformBadge platform={device.platform} />
            </TableCell>
            <TableCell>
                <span className="text-sm text-muted-foreground">
                    {device.osVersion || '-'}
                </span>
            </TableCell>
            <TableCell>
                <span className="text-sm text-muted-foreground">
                    {device.appVersion || '-'}
                </span>
            </TableCell>
            <TableCell>
                <span
                    className="text-sm text-muted-foreground"
                    title={device.lastSeenAt ? new Date(device.lastSeenAt * 1000).toISOString() : undefined}
                >
                    {getRelativeTime(device.lastSeenAt)}
                </span>
            </TableCell>
            <TableCell>
                {isRevoked ? (
                    <Badge variant="destructive" className="text-xs">
                        <Ban className="w-3 h-3 mr-1" />
                        Revoked
                    </Badge>
                ) : (
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={deviceUrl}>
                            <Eye className="w-4 h-4" />
                        </Link>
                    </Button>
                )}
            </TableCell>
        </TableRow>
    )
}

// =============================================================================
// Pagination
// =============================================================================

interface PaginationProps {
    pagination: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
    }
    onPageChange: (offset: number) => void
}

function TablePagination({ pagination, onPageChange }: PaginationProps) {
    const { total, limit, offset, hasMore } = pagination
    const currentPage = Math.floor(offset / limit) + 1
    const totalPages = Math.ceil(total / limit)
    const start = offset + 1
    const end = Math.min(offset + limit, total)

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
                Showing {start} to {end} of {total} devices
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(offset + limit)}
                    disabled={!hasMore}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

// =============================================================================
// Component
// =============================================================================

export function DeviceTable({
    devices,
    appId,
    accountId,
    pagination,
    onPageChange,
}: DeviceTableProps) {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>OS Version</TableHead>
                        <TableHead>App Version</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.map((device) => (
                        <DeviceRow
                            key={device.id}
                            device={device}
                            appId={appId}
                            accountId={accountId}
                        />
                    ))}
                </TableBody>
            </Table>
            {pagination && onPageChange && pagination.total > pagination.limit && (
                <TablePagination pagination={pagination} onPageChange={onPageChange} />
            )}
        </Card>
    )
}
