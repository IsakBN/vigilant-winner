'use client'

/**
 * Admin Subscriptions Page
 *
 * Subscription management interface with:
 * - Search and filtering
 * - Plan filter
 * - Status filter (active/trialing/cancelled/past_due)
 * - Sortable table display
 * - Pagination
 * - Click to view subscription details
 * - Link to user profile
 *
 * Note: This page is ready for integration when the subscriptions API is available.
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import {
    SubscriptionsFilters,
    SubscriptionsTable,
    SubscriptionsPagination,
    type Subscription,
    type SubscriptionPlan,
    type SubscriptionStatus,
    type SubscriptionSortBy,
} from '@/components/admin/subscriptions'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

// Placeholder data until API is connected
const MOCK_SUBSCRIPTIONS: Subscription[] = []

export default function SubscriptionsPage() {
    const router = useRouter()

    // Filter state
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [plan, setPlan] = useState<SubscriptionPlan | 'all'>('all')
    const [status, setStatus] = useState<SubscriptionStatus | 'all'>('all')
    const [sortBy, setSortBy] = useState<SubscriptionSortBy>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)

    // Loading state (will be from hook when API is ready)
    const [isLoading] = useState(false)
    const [isError] = useState(false)

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
    }, [plan, status, sortBy, sortOrder])

    // Filter and sort data (placeholder - will be server-side when API ready)
    const filteredData = filterSubscriptions(
        MOCK_SUBSCRIPTIONS,
        debouncedSearch,
        plan,
        status,
        sortBy,
        sortOrder
    )

    const total = filteredData.length
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Handlers
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value)
    }, [])

    const handlePlanChange = useCallback((value: SubscriptionPlan | 'all') => {
        setPlan(value)
    }, [])

    const handleStatusChange = useCallback((value: SubscriptionStatus | 'all') => {
        setStatus(value)
    }, [])

    const handleSortByChange = useCallback((value: SubscriptionSortBy) => {
        setSortBy(value)
    }, [])

    const handleSortOrderChange = useCallback((value: 'asc' | 'desc') => {
        setSortOrder(value)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    const handleSubscriptionClick = useCallback((_subscriptionId: string) => {
        // TODO: Open subscription detail modal when implemented
    }, [])

    const handleUserClick = useCallback((userId: string) => {
        router.push(`/admin/users/${userId}`)
    }, [router])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-purple/10 rounded-lg">
                        <CreditCard className="w-5 h-5 text-pastel-purple" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-dark">Subscriptions</h1>
                        <p className="text-sm text-text-light">
                            Manage subscription plans and billing
                        </p>
                    </div>
                </div>
                <div className="text-sm text-text-light">
                    Total: {String(total)} subscriptions
                </div>
            </div>

            {/* Filters */}
            <SubscriptionsFilters
                search={searchInput}
                onSearchChange={handleSearchChange}
                plan={plan}
                onPlanChange={handlePlanChange}
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
                    Failed to load subscriptions
                </div>
            )}

            {/* Info banner - remove when API is connected */}
            {!isLoading && paginatedData.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Subscriptions API Coming Soon</p>
                    <p className="text-sm mt-1">
                        This page will display subscription data once the API is connected.
                    </p>
                </div>
            )}

            {/* Table */}
            <SubscriptionsTable
                subscriptions={paginatedData}
                isLoading={isLoading}
                onSubscriptionClick={handleSubscriptionClick}
                onUserClick={handleUserClick}
            />

            {/* Pagination */}
            <SubscriptionsPagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={PAGE_SIZE}
                onPageChange={handlePageChange}
            />
        </div>
    )
}

// =============================================================================
// Helpers (placeholder - will be server-side when API ready)
// =============================================================================

function filterSubscriptions(
    subscriptions: Subscription[],
    search: string,
    plan: SubscriptionPlan | 'all',
    status: SubscriptionStatus | 'all',
    sortBy: SubscriptionSortBy,
    sortOrder: 'asc' | 'desc'
): Subscription[] {
    let filtered = [...subscriptions]

    // Filter by search
    if (search) {
        const lowerSearch = search.toLowerCase()
        filtered = filtered.filter(
            (sub) =>
                sub.userEmail?.toLowerCase().includes(lowerSearch) ??
                sub.userName?.toLowerCase().includes(lowerSearch) ??
                false
        )
    }

    // Filter by plan
    if (plan !== 'all') {
        filtered = filtered.filter((sub) => sub.planName === plan)
    }

    // Filter by status
    if (status !== 'all') {
        filtered = filtered.filter((sub) => sub.status === status)
    }

    // Sort
    filtered.sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
            case 'createdAt':
                comparison = a.createdAt - b.createdAt
                break
            case 'planName':
                comparison = a.planName.localeCompare(b.planName)
                break
            case 'status':
                comparison = a.status.localeCompare(b.status)
                break
            case 'periodEnd':
                comparison = (a.currentPeriodEnd ?? 0) - (b.currentPeriodEnd ?? 0)
                break
        }
        return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
}

