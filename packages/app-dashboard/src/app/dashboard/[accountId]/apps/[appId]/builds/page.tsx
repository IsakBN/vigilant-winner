'use client'

/**
 * Builds List Page
 *
 * Displays all builds for an app with filtering, search, and sorting.
 */

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Upload, Search } from 'lucide-react'
import { useBuilds, type ListBuildsParams } from '@/hooks/useBuilds'
import type { BuildStatus, BuildPlatform } from '@/lib/api/builds'
import {
    BuildTable,
    BuildsListSkeleton,
    EmptyBuildsState,
    type SortField,
    type SortOrder,
} from '@/components/builds'
import { Pagination } from '@/components/releases'
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
    const { data, isLoading, error } = useBuilds(accountId, appId, queryParams)

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
        setStatus(value as BuildStatus | 'all')
        setPage(1)
    }

    // Handle platform filter change
    const handlePlatformChange = (value: string) => {
        setPlatform(value as BuildPlatform | 'all')
        setPage(1)
    }

    // Handle search
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
                <Button asChild>
                    <Link href={`/dashboard/${accountId}/apps/${appId}/builds/new`}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Bundle
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
                <EmptyBuildsState accountId={accountId} appId={appId} />
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
