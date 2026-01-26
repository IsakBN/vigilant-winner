'use client'

import Link from 'next/link'
import { Package, Download, MoreVertical, Play, Pause, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Release, ReleaseStatus } from '@/lib/api/releases'

// =============================================================================
// Types
// =============================================================================

interface ReleaseCardProps {
    release: Release
    accountId: string
    appId: string
    onToggleStatus?: (releaseId: string, newStatus: ReleaseStatus) => void
    onDelete?: (releaseId: string) => void
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

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
}

function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
}

// =============================================================================
// Main Component
// =============================================================================

export function ReleaseCard({
    release,
    accountId,
    appId,
    onToggleStatus,
    onDelete,
}: ReleaseCardProps) {
    const releaseUrl = `/dashboard/${accountId}/apps/${appId}/releases/${release.id}`
    const isActive = release.status === 'active' || release.status === 'rolling'
    const canToggle = release.status === 'active' || release.status === 'paused' || release.status === 'rolling'

    const handleToggleStatus = () => {
        if (!onToggleStatus || !canToggle) return
        const newStatus: ReleaseStatus = isActive ? 'paused' : 'active'
        onToggleStatus(release.id, newStatus)
    }

    const handleDelete = () => {
        if (!onDelete) return
        onDelete(release.id)
    }

    return (
        <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <Link href={releaseUrl} className="group">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100">
                                <Package className="w-4 h-4 text-neutral-600" />
                            </div>
                            <div>
                                <span className="font-mono text-sm font-semibold text-neutral-900 group-hover:text-primary transition-colors">
                                    v{release.version}
                                </span>
                                <p className="text-xs text-neutral-500">
                                    {release.channel}
                                </p>
                            </div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={release.status} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={releaseUrl}>View Details</Link>
                                </DropdownMenuItem>
                                {canToggle && (
                                    <DropdownMenuItem onClick={handleToggleStatus}>
                                        {isActive ? (
                                            <>
                                                <Pause className="w-4 h-4 mr-2" />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                        <Download className="w-4 h-4" />
                        <span>{formatNumber(0)} downloads</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <div className="w-12 h-1 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${release.rolloutPercentage}%` }}
                                />
                            </div>
                            <span className="text-xs text-neutral-500">
                                {release.rolloutPercentage}%
                            </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                            {formatRelativeTime(release.createdAt)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
