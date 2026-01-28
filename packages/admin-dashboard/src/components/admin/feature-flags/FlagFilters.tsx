'use client'

/**
 * FlagFilters Component
 *
 * Filter controls for feature flag management:
 * - Search by name/key
 * - Status filter (active/inactive)
 * - Type filter (boolean/percentage/json)
 */

import { Search, Plus } from 'lucide-react'
import {
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Button,
} from '@bundlenudge/shared-ui'
import type { FeatureFlagStatus, FeatureFlagType } from '@/lib/api/types'

export interface FlagFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    status: FeatureFlagStatus | 'all'
    onStatusChange: (value: FeatureFlagStatus | 'all') => void
    type: FeatureFlagType | 'all'
    onTypeChange: (value: FeatureFlagType | 'all') => void
    onCreateClick: () => void
}

export function FlagFilters({
    search,
    onSearchChange,
    status,
    onStatusChange,
    type,
    onTypeChange,
    onCreateClick,
}: FlagFiltersProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <Input
                        type="text"
                        placeholder="Search by name or key..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Create button */}
                <Button onClick={onCreateClick}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Flag
                </Button>
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Status filter */}
                <Select
                    value={status}
                    onValueChange={(v) => onStatusChange(v as FeatureFlagStatus | 'all')}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                {/* Type filter */}
                <Select
                    value={type}
                    onValueChange={(v) => onTypeChange(v as FeatureFlagType | 'all')}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
