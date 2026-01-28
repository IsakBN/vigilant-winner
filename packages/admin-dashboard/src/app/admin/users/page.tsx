'use client'

/**
 * Admin Users Page
 *
 * User management interface with:
 * - Search and filtering
 * - Sortable table display
 * - Pagination
 * - Click to view user details
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { UsersFilters, UsersTable, UsersPagination } from '@/components/admin/users'
import type { UserStatus, ListUsersParams } from '@/lib/api/types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function UsersPage() {
    const router = useRouter()

    // Filter state
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [status, setStatus] = useState<UserStatus | 'all'>('all')
    const [sortBy, setSortBy] = useState<ListUsersParams['sortBy']>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput)
            setPage(1) // Reset to first page on search
        }, SEARCH_DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [searchInput])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [status, sortBy, sortOrder])

    // Build query params
    const queryParams: ListUsersParams = {
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

    // Fetch users
    const { users, total, totalPages, isLoading, isError, error } = useAdminUsers(queryParams)

    // Navigation handler
    const handleUserClick = useCallback(
        (userId: string) => {
            router.push(`/admin/users/${userId}`)
        },
        [router]
    )

    // Filter handlers
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value)
    }, [])

    const handleStatusChange = useCallback((value: UserStatus | 'all') => {
        setStatus(value)
    }, [])

    const handleSortByChange = useCallback((value: ListUsersParams['sortBy']) => {
        setSortBy(value)
    }, [])

    const handleSortOrderChange = useCallback((value: 'asc' | 'desc') => {
        setSortOrder(value)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-blue/10 rounded-lg">
                        <Users className="w-5 h-5 text-pastel-blue" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-dark">Users</h1>
                        <p className="text-sm text-text-light">
                            Manage user accounts and permissions
                        </p>
                    </div>
                </div>
                <div className="text-sm text-text-light">
                    Total: {String(total)} users
                </div>
            </div>

            {/* Filters */}
            <UsersFilters
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
                    {error instanceof Error ? error.message : 'Failed to load users'}
                </div>
            )}

            {/* Table */}
            <UsersTable
                users={users}
                isLoading={isLoading}
                onUserClick={handleUserClick}
            />

            {/* Pagination */}
            <UsersPagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={PAGE_SIZE}
                onPageChange={handlePageChange}
            />
        </div>
    )
}

