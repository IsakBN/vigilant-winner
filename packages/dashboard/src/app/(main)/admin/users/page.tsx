'use client'

/**
 * Admin Users Page
 *
 * Searchable, filterable list of all users for admin management.
 */

import { useState, useCallback, useMemo } from 'react'
import { useAdminUsers, useSuspendUser, useUnsuspendUser, useVerifyEmail } from '@/hooks/useAdmin'
import { UserTable } from '@/components/admin'
import { ErrorState } from '@/components/shared'
import {
    Button,
    Card,
    CardContent,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui'
import type { UserStatus, ListUsersParams } from '@/lib/api'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<UserStatus | 'all'>('all')
    const [page, setPage] = useState(1)
    const [sortBy, setSortBy] = useState<ListUsersParams['sortBy']>('createdAt')
    const [sortOrder, setSortOrder] = useState<ListUsersParams['sortOrder']>('desc')

    const params = useMemo<ListUsersParams>(
        () => ({
            search: search || undefined,
            status: status === 'all' ? undefined : status,
            page,
            limit: PAGE_SIZE,
            sortBy,
            sortOrder,
        }),
        [search, status, page, sortBy, sortOrder]
    )

    const { users, total, totalPages, isLoading, isError, error, refetch } = useAdminUsers(params)
    const suspendUser = useSuspendUser()
    const unsuspendUser = useUnsuspendUser()
    const verifyEmail = useVerifyEmail()

    const isActionPending =
        suspendUser.isPending || unsuspendUser.isPending || verifyEmail.isPending

    const handleSearch = useCallback((value: string) => {
        setSearch(value)
        setPage(1)
    }, [])

    const handleStatusFilter = useCallback((value: string) => {
        setStatus(value as UserStatus | 'all')
        setPage(1)
    }, [])

    const handleSortChange = useCallback((value: string) => {
        const [newSortBy, newSortOrder] = value.split('-') as [
            ListUsersParams['sortBy'],
            ListUsersParams['sortOrder']
        ]
        setSortBy(newSortBy)
        setSortOrder(newSortOrder)
        setPage(1)
    }, [])

    const handleSuspend = useCallback(
        (userId: string) => {
            suspendUser.mutate({ userId })
        },
        [suspendUser]
    )

    const handleUnsuspend = useCallback(
        (userId: string) => {
            unsuspendUser.mutate(userId)
        },
        [unsuspendUser]
    )

    const handleVerifyEmail = useCallback(
        (userId: string) => {
            verifyEmail.mutate(userId)
        },
        [verifyEmail]
    )

    return (
        <div className="space-y-6">
            <PageHeader total={total} />
            <FiltersSection
                search={search}
                status={status}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSearchChange={handleSearch}
                onStatusChange={handleStatusFilter}
                onSortChange={handleSortChange}
            />

            {isError ? (
                <ErrorState
                    message={error?.message ?? 'Failed to load users'}
                    onRetry={() => void refetch()}
                />
            ) : (
                <>
                    <Card>
                        <CardContent className="p-0">
                            <UserTable
                                users={users}
                                isLoading={isLoading}
                                onSuspend={handleSuspend}
                                onUnsuspend={handleUnsuspend}
                                onVerifyEmail={handleVerifyEmail}
                                isActionPending={isActionPending}
                            />
                        </CardContent>
                    </Card>

                    {totalPages > 1 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    )}
                </>
            )}
        </div>
    )
}

function PageHeader({ total }: { total: number }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-text-dark font-heading">Users</h1>
                <p className="text-text-light mt-1">
                    Manage all users on the platform ({total.toLocaleString()} total)
                </p>
            </div>
        </div>
    )
}

interface FiltersSectionProps {
    search: string
    status: UserStatus | 'all'
    sortBy: ListUsersParams['sortBy']
    sortOrder: ListUsersParams['sortOrder']
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onSortChange: (value: string) => void
}

function FiltersSection({
    search,
    status,
    sortBy,
    sortOrder,
    onSearchChange,
    onStatusChange,
    onSortChange,
}: FiltersSectionProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="max-w-md"
                />
            </div>
            <div className="flex gap-2">
                <Select value={status} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={onSortChange}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt-desc">Newest First</SelectItem>
                        <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                        <SelectItem value="lastLoginAt-desc">Recent Login</SelectItem>
                        <SelectItem value="email-asc">Email A-Z</SelectItem>
                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

interface PaginationProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-text-light">
                Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}

