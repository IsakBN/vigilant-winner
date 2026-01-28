'use client'

/**
 * Newsletter Admin Page
 *
 * Manages newsletter subscribers with:
 * - Stats overview (total, active, recent signups)
 * - Subscriber list with search and filters
 * - Pagination
 * - Export to CSV
 */

import { useState, useMemo, useCallback } from 'react'
import { Mail } from 'lucide-react'
import { useSubscribers, useExportSubscribers } from '@/hooks/useNewsletter'
import {
    NewsletterStats,
    SubscribersFilters,
    SubscribersTable,
    SubscribersPagination,
} from '@/components/admin/newsletter'
import type { SubscriberStatusFilter } from '@/components/admin/newsletter'

const PAGE_SIZE = 50
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export default function NewsletterPage() {
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<SubscriberStatusFilter>('all')
    const [offset, setOffset] = useState(0)

    const activeFilter = status === 'all' ? undefined : status === 'active'

    const { subscribers, pagination, isLoading, isError, error } = useSubscribers({
        search: search || undefined,
        active: activeFilter,
        limit: PAGE_SIZE,
        offset,
    })

    const exportMutation = useExportSubscribers()

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value)
        setOffset(0)
    }, [])

    const handleStatusChange = useCallback((value: SubscriberStatusFilter) => {
        setStatus(value)
        setOffset(0)
    }, [])

    const handleExport = useCallback(() => {
        exportMutation.mutate()
    }, [exportMutation])

    const { activeCount, recentSignups } = useMemo(() => {
        const now = Date.now()
        let active = 0
        let recent = 0

        for (const sub of subscribers) {
            if (sub.isActive) active++
            if (now - sub.subscribedAt < SEVEN_DAYS_MS) recent++
        }

        return { activeCount: active, recentSignups: recent }
    }, [subscribers])

    if (isError) {
        return (
            <div className="p-6">
                <PageHeader />
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
                    <p className="text-red-700">
                        Failed to load subscribers: {error?.message ?? 'Unknown error'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <PageHeader />

            <NewsletterStats
                pagination={pagination}
                activeCount={activeCount}
                recentSignups={recentSignups}
                isLoading={isLoading}
            />

            <SubscribersFilters
                search={search}
                onSearchChange={handleSearchChange}
                status={status}
                onStatusChange={handleStatusChange}
                onExport={handleExport}
                isExporting={exportMutation.isPending}
            />

            <SubscribersTable
                subscribers={subscribers}
                isLoading={isLoading}
            />

            <SubscribersPagination
                pagination={pagination}
                onOffsetChange={setOffset}
            />
        </div>
    )
}

function PageHeader() {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Mail className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-text-dark">Newsletter</h1>
                <p className="text-text-light">Manage newsletter subscribers</p>
            </div>
        </div>
    )
}

// Next.js App Router requires default export for pages
