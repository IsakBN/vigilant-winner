'use client'

/**
 * Devices List Page
 *
 * Displays all registered devices for an app with search, filtering, and pagination.
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Smartphone, Search } from 'lucide-react'
import { useDevices, type DevicePlatform } from '@/hooks'
import { DeviceTable, DeviceTableSkeleton } from '@/components/devices'
import {
    Button,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

type PlatformFilter = DevicePlatform | 'all'

// =============================================================================
// Page Header
// =============================================================================

interface PageHeaderProps {
    totalDevices: number
}

function PageHeader({ totalDevices }: PageHeaderProps) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
                <h1 className="text-xl font-semibold text-neutral-900">Devices</h1>
                <p className="text-sm text-neutral-500">
                    {totalDevices} registered device{totalDevices !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    )
}

// =============================================================================
// Filters
// =============================================================================

interface FiltersProps {
    search: string
    onSearchChange: (value: string) => void
    platform: PlatformFilter
    onPlatformChange: (value: PlatformFilter) => void
}

function Filters({
    search,
    onSearchChange,
    platform,
    onPlatformChange,
}: FiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                    placeholder="Search by device ID or model..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Platform Filter */}
            <Select value={platform} onValueChange={onPlatformChange}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyDeviceState() {
    return (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No devices connected
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                Devices will appear here once users install your app with the BundleNudge SDK.
            </p>
        </div>
    )
}

// =============================================================================
// No Results State
// =============================================================================

interface NoResultsProps {
    onClearFilters: () => void
}

function NoResultsState({ onClearFilters }: NoResultsProps) {
    return (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No devices found
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-4">
                No devices match your current search and filter criteria.
            </p>
            <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
            </Button>
        </div>
    )
}

// =============================================================================
// Page Component
// =============================================================================

export default function DevicesPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string

    // Filter state
    const [search, setSearch] = useState('')
    const [platform, setPlatform] = useState<PlatformFilter>('all')
    const [offset, setOffset] = useState(0)

    // Build params for API
    const queryParams = {
        limit: 20,
        offset,
        platform: platform !== 'all' ? platform : undefined,
        search: search || undefined,
    }

    const { devices, pagination, isLoading } = useDevices(accountId, appId, queryParams)

    const handleClearFilters = () => {
        setSearch('')
        setPlatform('all')
        setOffset(0)
    }

    const handlePageChange = (newOffset: number) => {
        setOffset(newOffset)
    }

    // Loading state
    if (isLoading) {
        return (
            <div>
                <PageHeader totalDevices={0} />
                <Filters
                    search={search}
                    onSearchChange={setSearch}
                    platform={platform}
                    onPlatformChange={setPlatform}
                />
                <DeviceTableSkeleton />
            </div>
        )
    }

    // Empty state (no devices at all)
    const hasNoDevices = !pagination?.total && !search && platform === 'all'
    if (hasNoDevices) {
        return (
            <div>
                <PageHeader totalDevices={0} />
                <EmptyDeviceState />
            </div>
        )
    }

    // No results state (filters applied but no matches)
    const hasNoResults = devices.length === 0
    if (hasNoResults) {
        return (
            <div>
                <PageHeader totalDevices={pagination?.total ?? 0} />
                <Filters
                    search={search}
                    onSearchChange={setSearch}
                    platform={platform}
                    onPlatformChange={setPlatform}
                />
                <NoResultsState onClearFilters={handleClearFilters} />
            </div>
        )
    }

    return (
        <div>
            <PageHeader totalDevices={pagination?.total ?? 0} />
            <Filters
                search={search}
                onSearchChange={setSearch}
                platform={platform}
                onPlatformChange={setPlatform}
            />
            <DeviceTable
                devices={devices}
                appId={appId}
                accountId={accountId}
                pagination={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    )
}
