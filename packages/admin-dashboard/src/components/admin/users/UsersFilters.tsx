'use client'

/**
 * UsersFilters Component
 *
 * Filter controls for admin user management:
 * - Search by email/name
 * - Status filter (active/suspended/banned)
 * - Sort controls
 */

import { Search, ArrowUpDown } from 'lucide-react'
import {
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Button,
} from '@bundlenudge/shared-ui'
import type { UserStatus, ListUsersParams } from '@/lib/api/types'

export interface UsersFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    status: UserStatus | 'all'
    onStatusChange: (value: UserStatus | 'all') => void
    sortBy: ListUsersParams['sortBy']
    onSortByChange: (value: ListUsersParams['sortBy']) => void
    sortOrder: 'asc' | 'desc'
    onSortOrderChange: (value: 'asc' | 'desc') => void
}

export function UsersFilters({
    search,
    onSearchChange,
    status,
    onStatusChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
}: UsersFiltersProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <Input
                    type="text"
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Status filter */}
                <Select
                    value={status}
                    onValueChange={(v) => onStatusChange(v as UserStatus | 'all')}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort by */}
                <Select
                    value={sortBy ?? 'createdAt'}
                    onValueChange={(v) => onSortByChange(v as ListUsersParams['sortBy'])}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt">Date Created</SelectItem>
                        <SelectItem value="lastLoginAt">Last Login</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort order toggle */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="sr-only">
                        {sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                    </span>
                </Button>
            </div>
        </div>
    )
}
