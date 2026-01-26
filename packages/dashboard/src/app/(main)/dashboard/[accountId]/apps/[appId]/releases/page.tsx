'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Package } from 'lucide-react'
import { useReleases, type ListReleasesParams } from '@/hooks/useReleases'
import { ReleaseTable } from '@/components/releases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { ReleaseStatus } from '@/lib/api/releases'

// =============================================================================
// Types
// =============================================================================

type SortField = 'version' | 'createdAt' | 'rolloutPercentage'
type SortOrder = 'asc' | 'desc'

// =============================================================================
// Helper Components
// =============================================================================

function ReleasesListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
}

function EmptyState({ accountId, appId }: { accountId: string; appId: string }) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
                    <Package className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    No releases yet
                </h3>
                <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">
                    Create your first release to start pushing OTA updates to your app users.
                </p>
                <Button asChild>
                    <Link href={`/dashboard/${accountId}/apps/${appId}/releases/new`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Release
                    </Link>
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

export default function ReleasesPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string

    // Filter and sort state
    const [status, setStatus] = useState<ReleaseStatus | 'all'>('all')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<SortField>('createdAt')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [page, setPage] = useState(1)

    // Build query params
    const queryParams: ListReleasesParams = useMemo(() => ({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        sortBy,
        sortOrder,
        page,
        pageSize: 10,
    }), [status, search, sortBy, sortOrder, page])

    // Fetch releases
    const { data, isLoading, error } = useReleases(appId, queryParams)

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

    // Handle status filter change
    const handleStatusChange = (value: string) => {
        setStatus(value as ReleaseStatus | 'all')
        setPage(1)
    }

    // Handle search
    const handleSearch = (value: string) => {
        setSearch(value)
        setPage(1)
    }

    if (isLoading) {
        return <ReleasesListSkeleton />
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Failed to load releases: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        )
    }

    const releases = data?.releases ?? []
    const pagination = data?.pagination

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Releases</h2>
                    <p className="text-sm text-neutral-500">
                        {pagination?.total ?? 0} release{(pagination?.total ?? 0) !== 1 ? 's' : ''} total
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/dashboard/${accountId}/apps/${appId}/releases/new`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Release
                    </Link>
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
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="rolling">Rolling</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Content */}
            {releases.length === 0 ? (
                <EmptyState accountId={accountId} appId={appId} />
            ) : (
                <Card>
                    <ReleaseTable
                        releases={releases}
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
