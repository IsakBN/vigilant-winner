'use client'

/**
 * OrgsFilters Component
 *
 * Filter controls for admin organization management:
 * - Search by name/slug
 * - Plan filter (free/pro/enterprise)
 * - Status filter (active/suspended)
 */

import { Search } from 'lucide-react'
import {
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'
import type { OrgsFiltersProps } from './types'
import { PLAN_LABELS, STATUS_LABELS } from './utils'

export function OrgsFilters({
    search,
    onSearchChange,
    plan,
    onPlanChange,
    status,
    onStatusChange,
}: OrgsFiltersProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <Input
                    type="text"
                    placeholder="Search by name or slug..."
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
                    onValueChange={(v) => onPlanChange(v as typeof plan)}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{PLAN_LABELS.all}</SelectItem>
                        <SelectItem value="free">{PLAN_LABELS.free}</SelectItem>
                        <SelectItem value="pro">{PLAN_LABELS.pro}</SelectItem>
                        <SelectItem value="enterprise">{PLAN_LABELS.enterprise}</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status filter */}
                <Select
                    value={status}
                    onValueChange={(v) => onStatusChange(v as typeof status)}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{STATUS_LABELS.all}</SelectItem>
                        <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                        <SelectItem value="suspended">{STATUS_LABELS.suspended}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export type { OrgsFiltersProps }
