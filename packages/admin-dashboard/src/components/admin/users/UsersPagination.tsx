'use client'

/**
 * UsersPagination Component
 *
 * Pagination controls for user list with:
 * - Page info display
 * - Previous/Next buttons
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@bundlenudge/shared-ui'

export interface UsersPaginationProps {
    page: number
    totalPages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
}

export function UsersPagination({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
}: UsersPaginationProps) {
    if (totalPages <= 1) {
        return null
    }

    const start = (page - 1) * limit + 1
    const end = Math.min(page * limit, total)

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border">
            <div className="text-sm text-text-light">
                Showing {String(start)} to {String(end)} of {String(total)} users
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </Button>
                <span className="text-sm text-text-dark px-2">
                    Page {String(page)} of {String(totalPages)}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    )
}
