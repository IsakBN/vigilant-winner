'use client'

/**
 * Releases List Page
 *
 * Displays all releases for an app with filtering, search, and sorting.
 */

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { useReleases, type ListReleasesParams } from '@/hooks/useReleases'
import {
    ReleaseTable,
    ReleasesListSkeleton,
    EmptyReleasesState,
    Pagination,
    type SortField,
    type SortOrder,
} from '@/components/releases'
import {
    Card,
    Button,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'
import type { ReleaseStatus } from '@/components/releases'

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
    const queryParams: ListReleasesParams = useMemo(
        () => ({
            status: status === 'all' ? undefined : status,
            search: search || undefined,
            sortBy,
            sortOrder,
            page,
            pageSize: 10,
        }),
        [status, search, sortBy, sortOrder, page]
    )

    // Fetch releases
    const { data, isLoading, error } = useReleases(accountId, appId, queryParams)

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
                Failed to load releases:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
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
                        {pagination?.total ?? 0} release
                        {(pagination?.total ?? 0) !== 1 ? 's' : ''} total
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
                <EmptyReleasesState accountId={accountId} appId={appId} />
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
