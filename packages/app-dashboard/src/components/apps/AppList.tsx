'use client'

/**
 * AppList Component
 *
 * Grid layout for displaying apps with search and filter controls.
 */

import { useState, useCallback, useMemo } from 'react'
import { AppCard } from './AppCard'
import { AppListSkeleton } from './AppListSkeleton'
import { EmptyAppState } from './EmptyAppState'
import { PlatformFilter } from './PlatformFilter'
import { Input } from '@bundlenudge/shared-ui'
import { ErrorState } from '@/components/shared/ErrorState'
import { useApps, type AppFilters } from '@/hooks/useApps'
import type { Platform } from '@/lib/api'

interface AppListProps {
    accountId: string
    onCreateApp?: () => void
}

export function AppList({ accountId, onCreateApp }: AppListProps) {
    const [filters, setFilters] = useState<AppFilters>({
        platform: 'all',
        search: '',
    })

    const { apps, total, filteredCount, isLoading, isError, error, refetch } = useApps(
        accountId,
        filters
    )

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setFilters((prev) => ({ ...prev, search: e.target.value }))
        },
        []
    )

    const handlePlatformChange = useCallback((platform: Platform | 'all') => {
        setFilters((prev) => ({ ...prev, platform }))
    }, [])

    const handleClearFilters = useCallback(() => {
        setFilters({ platform: 'all', search: '' })
    }, [])

    const hasActiveFilters = useMemo(() => {
        return filters.platform !== 'all' || (filters.search?.length ?? 0) > 0
    }, [filters])

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <FilterBar
                    search={filters.search ?? ''}
                    platform={filters.platform ?? 'all'}
                    onSearchChange={handleSearchChange}
                    onPlatformChange={handlePlatformChange}
                    disabled
                />
                <AppListSkeleton count={6} />
            </div>
        )
    }

    // Error state
    if (isError) {
        return (
            <ErrorState
                message={error?.message ?? 'Failed to load apps'}
                onRetry={() => void refetch()}
            />
        )
    }

    // Empty state - no apps at all
    if (total === 0) {
        return <EmptyAppState type="no-apps" onCreateApp={onCreateApp} />
    }

    // Empty state - filters return no results
    if (filteredCount === 0 && hasActiveFilters) {
        return (
            <div className="space-y-6">
                <FilterBar
                    search={filters.search ?? ''}
                    platform={filters.platform ?? 'all'}
                    onSearchChange={handleSearchChange}
                    onPlatformChange={handlePlatformChange}
                />
                <EmptyAppState type="no-results" onClearFilters={handleClearFilters} />
            </div>
        )
    }

    // Apps grid
    return (
        <div className="space-y-6">
            <FilterBar
                search={filters.search ?? ''}
                platform={filters.platform ?? 'all'}
                onSearchChange={handleSearchChange}
                onPlatformChange={handlePlatformChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map((app) => (
                    <AppCard key={app.id} app={app} accountId={accountId} />
                ))}
            </div>
        </div>
    )
}

interface FilterBarProps {
    search: string
    platform: Platform | 'all'
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onPlatformChange: (platform: Platform | 'all') => void
    disabled?: boolean
}

function FilterBar({
    search,
    platform,
    onSearchChange,
    onPlatformChange,
    disabled,
}: FilterBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
                <Input
                    type="search"
                    placeholder="Search apps..."
                    value={search}
                    onChange={onSearchChange}
                    disabled={disabled}
                    className="w-full"
                />
            </div>

            {/* Platform Filter */}
            <PlatformFilter
                value={platform}
                onChange={onPlatformChange}
                disabled={disabled}
            />
        </div>
    )
}
