'use client'

/**
 * SubscriptionsFilters Component
 *
 * Filter controls for admin subscription management:
 * - Search by email
 * - Plan filter
 * - Status filter
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

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'team' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired'
export type SubscriptionSortBy = 'createdAt' | 'planName' | 'status' | 'periodEnd'

export interface SubscriptionsFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    plan: SubscriptionPlan | 'all'
    onPlanChange: (value: SubscriptionPlan | 'all') => void
    status: SubscriptionStatus | 'all'
    onStatusChange: (value: SubscriptionStatus | 'all') => void
    sortBy: SubscriptionSortBy
    onSortByChange: (value: SubscriptionSortBy) => void
    sortOrder: 'asc' | 'desc'
    onSortOrderChange: (value: 'asc' | 'desc') => void
}

export function SubscriptionsFilters({
    search,
    onSearchChange,
    plan,
    onPlanChange,
    status,
    onStatusChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
}: SubscriptionsFiltersProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <Input
                    type="text"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Plan filter */}
                <Select
                    value={plan}
                    onValueChange={(v) => onPlanChange(v as SubscriptionPlan | 'all')}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status filter */}
                <Select
                    value={status}
                    onValueChange={(v) => onStatusChange(v as SubscriptionStatus | 'all')}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort by */}
                <Select
                    value={sortBy}
                    onValueChange={(v) => onSortByChange(v as SubscriptionSortBy)}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt">Created</SelectItem>
                        <SelectItem value="planName">Plan</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="periodEnd">Period End</SelectItem>
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
