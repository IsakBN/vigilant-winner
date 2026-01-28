'use client'

/**
 * SubscribersFilters Component
 *
 * Filter controls for newsletter subscriber management:
 * - Search by email/name
 * - Status filter (active/unsubscribed/all)
 * - Export button
 */

import { Search, Download, Loader2 } from 'lucide-react'
import {
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Button,
} from '@bundlenudge/shared-ui'

export type SubscriberStatusFilter = 'all' | 'active' | 'unsubscribed'

export interface SubscribersFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    status: SubscriberStatusFilter
    onStatusChange: (value: SubscriberStatusFilter) => void
    onExport: () => void
    isExporting: boolean
}

export function SubscribersFilters({
    search,
    onSearchChange,
    status,
    onStatusChange,
    onExport,
    isExporting,
}: SubscribersFiltersProps) {
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
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Status filter */}
                    <Select
                        value={status}
                        onValueChange={(v) => onStatusChange(v as SubscriberStatusFilter)}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subscribers</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Export button */}
                <Button
                    variant="outline"
                    onClick={onExport}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4 mr-2" />
                    )}
                    Export CSV
                </Button>
            </div>
        </div>
    )
}
