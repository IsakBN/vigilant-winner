'use client'

/**
 * AppsFilters Component
 *
 * Filter controls for admin app management:
 * - Search by name/owner
 * - Status filter (active/disabled)
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
import type { AdminAppStatus, AdminAppSortBy } from '@/lib/api/types/admin'

export interface AppsFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    status: AdminAppStatus | 'all'
    onStatusChange: (value: AdminAppStatus | 'all') => void
    sortBy: AdminAppSortBy
    onSortByChange: (value: AdminAppSortBy) => void
    sortOrder: 'asc' | 'desc'
    onSortOrderChange: (value: 'asc' | 'desc') => void
}

export function AppsFilters({
    search,
    onSearchChange,
    status,
    onStatusChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
}: AppsFiltersProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <Input
                    type="text"
                    placeholder="Search by name or owner email..."
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
                    onValueChange={(v) => onStatusChange(v as AdminAppStatus | 'all')}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort by */}
                <Select
                    value={sortBy}
                    onValueChange={(v) => onSortByChange(v as AdminAppSortBy)}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt">Date Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="totalDownloads">Downloads</SelectItem>
                        <SelectItem value="lastUpdate">Last Update</SelectItem>
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
