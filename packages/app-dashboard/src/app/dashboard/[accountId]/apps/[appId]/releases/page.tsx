'use client'

/**
 * Releases List Page
 *
 * Displays all releases for an app with filtering, search, sorting,
 * and quick actions for pause/resume.
 */

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Package } from 'lucide-react'
import { useReleases, useUpdateRelease, type ListReleasesParams } from '@/hooks/useReleases'
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
            sortBy: sortBy === 'downloads' ? 'createdAt' : sortBy, // API may not support downloads sort
            sortOrder,
            page,
            pageSize: 10,
        }),
        [status, search, sortBy, sortOrder, page]
    )

    // Fetch releases
    const { data, isLoading, error } = useReleases(accountId, appId, queryParams)

    // Update release mutation for pause/resume
    const updateRelease = useUpdateRelease(accountId, appId)

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

    // Handle pause release
    const handlePause = useCallback(
        (releaseId: string) => {
            updateRelease.mutate({
                releaseId,
                data: { status: 'paused' },
            })
        },
        [updateRelease]
    )

    // Handle resume release
    const handleResume = useCallback(
        (releaseId: string) => {
            updateRelease.mutate({
                releaseId,
                data: { status: 'active' },
            })
        },
        [updateRelease]
    )

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
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">Releases</h2>
                        <p className="text-sm text-neutral-500">
                            {pagination?.total ?? 0} release
                            {(pagination?.total ?? 0) !== 1 ? 's' : ''} total
                        </p>
                    </div>
                </div>
                <Button asChild>
                    <Link href={`/dashboard/${accountId}/apps/${appId}/releases/new`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Release
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
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
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="rolling">Rolling Out</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Content */}
            {releases.length === 0 ? (
                <EmptyReleasesState accountId={accountId} appId={appId} />
            ) : (
                <Card className="overflow-hidden">
                    <ReleaseTable
                        releases={releases}
                        accountId={accountId}
                        appId={appId}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        onPause={handlePause}
                        onResume={handleResume}
                    />

                    {/* Pagination inside card */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-4 pb-4">
                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}
