'use client'

/**
 * AppsTable Component
 *
 * Displays apps in a table with:
 * - Name, bundle ID
 * - Organization
 * - Platform
 * - Downloads count
 * - Status badges
 * - Click to view action
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
    Button,
} from '@bundlenudge/shared-ui'
import type { AdminApp, AdminAppStatus, AdminAppPlatform } from '@/lib/api/types/admin'

export interface AppsTableProps {
    apps: AdminApp[]
    isLoading: boolean
    onAppClick: (appId: string) => void
}

export function AppsTable({ apps, isLoading, onAppClick }: AppsTableProps) {
    if (isLoading) {
        return <AppsTableSkeleton />
    }

    if (apps.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-text-light">No apps match your filters</p>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">App</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Bundles</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {apps.map((app) => (
                        <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="px-4">
                                <AppCell app={app} />
                            </TableCell>
                            <TableCell className="text-text-dark text-sm">
                                {app.orgName}
                            </TableCell>
                            <TableCell>
                                <PlatformBadge platform={app.platform} />
                            </TableCell>
                            <TableCell className="text-text-dark">
                                {String(app.bundleCount)}
                            </TableCell>
                            <TableCell className="text-text-dark">
                                {formatNumber(app.totalDownloads)}
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={app.status} />
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => onAppClick(app.id)}
                                    className="text-bright-accent hover:text-bright-accent/80"
                                >
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

interface AppCellProps {
    app: AdminApp
}

function AppCell({ app }: AppCellProps) {
    return (
        <div>
            <div className="text-sm font-medium text-text-dark">
                {app.name}
            </div>
            <div className="text-xs text-text-light">
                Created {formatDate(app.createdAt)}
            </div>
        </div>
    )
}

interface StatusBadgeProps {
    status: AdminAppStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <Badge className={STATUS_BADGE_CLASSES[status]}>
            {STATUS_LABELS[status]}
        </Badge>
    )
}

interface PlatformBadgeProps {
    platform: AdminAppPlatform
}

function PlatformBadge({ platform }: PlatformBadgeProps) {
    return (
        <Badge className={PLATFORM_BADGE_CLASSES[platform]}>
            {PLATFORM_LABELS[platform]}
        </Badge>
    )
}

function AppsTableSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">App</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Bundles</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4">
                                <div>
                                    <Skeleton className="h-4 w-40 mb-1" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_BADGE_CLASSES: Record<AdminAppStatus, string> = {
    active: 'bg-green-100 text-green-700',
    disabled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<AdminAppStatus, string> = {
    active: 'Active',
    disabled: 'Disabled',
}

const PLATFORM_BADGE_CLASSES: Record<AdminAppPlatform, string> = {
    ios: 'bg-blue-100 text-blue-700',
    android: 'bg-green-100 text-green-700',
    both: 'bg-purple-100 text-purple-700',
}

const PLATFORM_LABELS: Record<AdminAppPlatform, string> = {
    ios: 'iOS',
    android: 'Android',
    both: 'Both',
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
}
