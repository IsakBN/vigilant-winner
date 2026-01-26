'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Search, Hammer, Upload } from 'lucide-react'
import { useBuilds, type ListBuildsParams } from '@/hooks/useBuilds'
import { BuildTable } from '@/components/builds'
import { Button, Input, Card, CardContent, Skeleton } from '@/components/ui'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { BuildStatus, BuildPlatform } from '@/lib/api/builds'

// =============================================================================
// Types
// =============================================================================

type SortField = 'createdAt' | 'version' | 'status'
type SortOrder = 'asc' | 'desc'

// =============================================================================
// Helper Components
// =============================================================================

function BuildsListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
}

function EmptyState({ accountId: _accountId, appId: _appId }: { accountId: string; appId: string }) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
                    <Hammer className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    No builds yet
                </h3>
                <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">
                    Upload a bundle or trigger a build to create your first build.
                </p>
                <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Bundle
                </Button>
            </CardContent>
        </Card>
    )
}

function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}) {
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-2 pt-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
            >
                Previous
            </Button>
            <span className="text-sm text-neutral-500">
                Page {page} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
            >
                Next
            </Button>
        </div>
    )
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function BuildsPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string

    // Filter and sort state
    const [status, setStatus] = useState<BuildStatus | 'all'>('all')
    const [platform, setPlatform] = useState<BuildPlatform | 'all'>('all')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<SortField>('createdAt')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [page, setPage] = useState(1)

    // Build query params
    const queryParams: ListBuildsParams = useMemo(
        () => ({
            status: status === 'all' ? undefined : status,
            platform: platform === 'all' ? undefined : platform,
            search: search || undefined,
            sortBy,
            sortOrder,
            page,
            pageSize: 10,
        }),
        [status, platform, search, sortBy, sortOrder, page]
    )

    // Fetch builds
    const { data, isLoading, error } = useBuilds(appId, queryParams)

    // Handle sort toggle
    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy(field)
            setSortOrder('desc')
        }
        setPage(1)
    }

    // Handle filter changes
    const handleStatusChange = (value: string) => {
        setStatus(value as BuildStatus | 'all')
        setPage(1)
    }

    const handlePlatformChange = (value: string) => {
        setPlatform(value as BuildPlatform | 'all')
        setPage(1)
    }

    const handleSearch = (value: string) => {
        setSearch(value)
        setPage(1)
    }

    if (isLoading) {
        return <BuildsListSkeleton />
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Failed to load builds:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        )
    }

    const builds = data?.builds ?? []
    const pagination = data?.pagination

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Builds</h2>
                    <p className="text-sm text-neutral-500">
                        {pagination?.total ?? 0} build
                        {(pagination?.total ?? 0) !== 1 ? 's' : ''} total
                    </p>
                </div>
                <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Bundle
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Search by version..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={platform} onValueChange={handlePlatformChange}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Content */}
            {builds.length === 0 ? (
                <EmptyState accountId={accountId} appId={appId} />
            ) : (
                <Card>
                    <BuildTable
                        builds={builds}
                        accountId={accountId}
                        appId={appId}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                    />
                </Card>
            )}

            {/* Pagination */}
            {pagination && (
                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    )
}
