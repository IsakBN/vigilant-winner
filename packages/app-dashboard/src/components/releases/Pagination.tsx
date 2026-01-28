'use client'

/**
 * Pagination Component
 *
 * Simple pagination controls for navigating through pages.
 */

import { Button } from '@bundlenudge/shared-ui'

interface PaginationProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) {
        return null
    }

    return (
        <div className="flex items-center justify-center gap-2 pt-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
            >
                Previous
            </Button>
            <span className="text-sm text-neutral-500">
                Page {page} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
            >
                Next
            </Button>
        </div>
    )
}
