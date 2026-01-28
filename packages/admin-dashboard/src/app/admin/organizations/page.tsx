'use client'

/**
 * Admin Organizations Page
 *
 * Organization management interface with:
 * - Search and filtering
 * - Sortable table display
 * - Pagination
 * - Actions: suspend, reactivate, view details
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { useAdminOrgs, useSuspendOrg, useReactivateOrg } from '@/hooks/useAdminOrgs'
import { OrgsFilters, OrgsTable, OrgsPagination } from '@/components/admin/orgs'
import type { OrgPlan, ListAdminOrgsParams } from '@/lib/api/types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function OrganizationsPage() {
    const router = useRouter()

    // Filter state
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [plan, setPlan] = useState<OrgPlan | 'all'>('all')
    const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all')
    const [page, setPage] = useState(1)
    const [pendingActions, setPendingActions] = useState<Set<string>>(new Set())

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
    }, [plan, status])

    // Build query params
    const queryParams: ListAdminOrgsParams = useMemo(() => {
        const params: ListAdminOrgsParams = {
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
        }

        if (debouncedSearch.trim()) {
            params.search = debouncedSearch.trim()
        }

        if (plan !== 'all') {
            params.plan = plan
        }

        return params
    }, [page, debouncedSearch, plan])

    // Fetch organizations
    const { organizations, total, isLoading, isError, error, refetch } = useAdminOrgs(queryParams)

    // Filter by status client-side (since API may not support it)
    const filteredOrgs = useMemo(() => {
        if (status === 'all') return organizations
        return organizations.filter((org) =>
            status === 'active' ? org.isActive : !org.isActive
        )
    }, [organizations, status])

    // Calculate pagination
    const totalPages = Math.ceil(total / PAGE_SIZE)

    // Mutations
    const suspendMutation = useSuspendOrg()
    const reactivateMutation = useReactivateOrg()

    // Navigation handler
    const handleOrgClick = useCallback(
        (orgId: string) => {
            router.push(`/admin/organizations/${orgId}`)
        },
        [router]
    )

    // Action handlers
    const handleSuspend = useCallback(
        (orgId: string) => {
            setPendingActions((prev) => new Set(prev).add(orgId))
            suspendMutation.mutate(orgId, {
                onSettled: () => {
                    setPendingActions((prev) => {
                        const next = new Set(prev)
                        next.delete(orgId)
                        return next
                    })
                    void refetch()
                },
            })
        },
        [suspendMutation, refetch]
    )

    const handleReactivate = useCallback(
        (orgId: string) => {
            setPendingActions((prev) => new Set(prev).add(orgId))
            reactivateMutation.mutate(orgId, {
                onSettled: () => {
                    setPendingActions((prev) => {
                        const next = new Set(prev)
                        next.delete(orgId)
                        return next
                    })
                    void refetch()
                },
            })
        },
        [reactivateMutation, refetch]
    )

    // Filter handlers
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value)
    }, [])

    const handlePlanChange = useCallback((value: OrgPlan | 'all') => {
        setPlan(value)
    }, [])

    const handleStatusChange = useCallback((value: 'all' | 'active' | 'suspended') => {
        setStatus(value)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-purple/10 rounded-lg">
                        <Building2 className="w-5 h-5 text-pastel-purple" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-dark">Organizations</h1>
                        <p className="text-sm text-text-light">
                            Manage organizations, plans, and access
                        </p>
                    </div>
                </div>
                <div className="text-sm text-text-light">
                    Total: {String(total)} organizations
                </div>
            </div>

            {/* Filters */}
            <OrgsFilters
                search={searchInput}
                onSearchChange={handleSearchChange}
                plan={plan}
                onPlanChange={handlePlanChange}
                status={status}
                onStatusChange={handleStatusChange}
            />

            {/* Error state */}
            {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error instanceof Error ? error.message : 'Failed to load organizations'}
                </div>
            )}

            {/* Table */}
            <OrgsTable
                organizations={filteredOrgs}
                isLoading={isLoading}
                onOrgClick={handleOrgClick}
                onSuspend={handleSuspend}
                onReactivate={handleReactivate}
                pendingActions={pendingActions}
            />

            {/* Pagination */}
            <OrgsPagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={PAGE_SIZE}
                onPageChange={handlePageChange}
            />
        </div>
    )
}

