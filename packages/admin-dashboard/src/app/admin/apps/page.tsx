'use client'

/**
 * Admin Apps Page
 *
 * App management interface with:
 * - Search and filtering
 * - Status filter (active/disabled)
 * - Sortable table display
 * - Pagination
 * - Click to view app details
 */

import { useState, useCallback, useEffect } from 'react'
import { Box } from 'lucide-react'
import { useAdminApps } from '@/hooks/useAdminOps'
import {
    AppsFilters,
    AppsTable,
    AppsPagination,
    AppDetailModal,
} from '@/components/admin/apps'
import type { AdminAppStatus, AdminAppSortBy, ListAdminAppsParams } from '@/lib/api/types/admin'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function AppsPage() {
    // Filter state
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [status, setStatus] = useState<AdminAppStatus | 'all'>('all')
    const [sortBy, setSortBy] = useState<AdminAppSortBy>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)

    // Modal state
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput)
            setPage(1)
        }, SEARCH_DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [searchInput])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [status, sortBy, sortOrder])

    // Build query params
    const queryParams: ListAdminAppsParams = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder,
    }

    if (debouncedSearch.trim()) {
        queryParams.search = debouncedSearch.trim()
    }

    if (status !== 'all') {
        queryParams.status = status
    }

    // Fetch apps
    const { apps, total, totalPages, isLoading, isError, error, refetch } = useAdminApps(queryParams)

    // Handlers
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value)
    }, [])

    const handleStatusChange = useCallback((value: AdminAppStatus | 'all') => {
        setStatus(value)
    }, [])

    const handleSortByChange = useCallback((value: AdminAppSortBy) => {
        setSortBy(value)
    }, [])

    const handleSortOrderChange = useCallback((value: 'asc' | 'desc') => {
        setSortOrder(value)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    const handleAppClick = useCallback((appId: string) => {
        setSelectedAppId(appId)
    }, [])

    const handleModalClose = useCallback(() => {
        setSelectedAppId(null)
    }, [])

    const handleAppUpdated = useCallback(() => {
        void refetch()
    }, [refetch])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-green/10 rounded-lg">
                        <Box className="w-5 h-5 text-pastel-green" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-dark">Apps</h1>
                        <p className="text-sm text-text-light">
                            Manage applications and their status
                        </p>
                    </div>
                </div>
                <div className="text-sm text-text-light">
                    Total: {String(total)} apps
                </div>
            </div>

            {/* Filters */}
            <AppsFilters
                search={searchInput}
                onSearchChange={handleSearchChange}
                status={status}
                onStatusChange={handleStatusChange}
                sortBy={sortBy}
                onSortByChange={handleSortByChange}
                sortOrder={sortOrder}
                onSortOrderChange={handleSortOrderChange}
            />

            {/* Error state */}
            {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error instanceof Error ? error.message : 'Failed to load apps'}
                </div>
            )}

            {/* Table */}
            <AppsTable
                apps={apps}
                isLoading={isLoading}
                onAppClick={handleAppClick}
            />

            {/* Pagination */}
            <AppsPagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={PAGE_SIZE}
                onPageChange={handlePageChange}
            />

            {/* Detail Modal */}
            <AppDetailModal
                appId={selectedAppId}
                open={selectedAppId !== null}
                onClose={handleModalClose}
                onAppUpdated={handleAppUpdated}
            />
        </div>
    )
}

