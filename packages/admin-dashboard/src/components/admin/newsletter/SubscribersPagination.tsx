'use client'

/**
 * SubscribersPagination Component
 *
 * Pagination controls for subscriber list with:
 * - Page info display
 * - Previous/Next buttons
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@bundlenudge/shared-ui'
import type { Pagination } from '@/lib/api/types'

export interface SubscribersPaginationProps {
    pagination: Pagination
    onOffsetChange: (offset: number) => void
}

export function SubscribersPagination({
    pagination,
    onOffsetChange,
}: SubscribersPaginationProps) {
    const { total, limit, offset, hasMore } = pagination

    if (total <= limit) {
        return null
    }

    const currentPage = Math.floor(offset / limit) + 1
    const totalPages = Math.ceil(total / limit)
    const start = offset + 1
    const end = Math.min(offset + limit, total)

    const handlePrevious = () => {
        const newOffset = Math.max(0, offset - limit)
        onOffsetChange(newOffset)
    }

    const handleNext = () => {
        const newOffset = offset + limit
        onOffsetChange(newOffset)
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border">
            <div className="text-sm text-text-light">
                Showing {String(start)} to {String(end)} of {String(total)} subscribers
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={offset === 0}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </Button>
                <span className="text-sm text-text-dark px-2">
                    Page {String(currentPage)} of {String(totalPages)}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!hasMore}
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    )
}
