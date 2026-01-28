'use client'

/**
 * Pagination Component
 *
 * Polished pagination controls with page numbers and navigation.
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button, cn } from '@bundlenudge/shared-ui'

interface PaginationProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

/**
 * Generate page numbers to display
 */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = []

    // Always show first page
    pages.push(1)

    if (current <= 3) {
        // Near start: 1 2 3 4 5 ... last
        pages.push(2, 3, 4, 5, 'ellipsis', total)
    } else if (current >= total - 2) {
        // Near end: 1 ... n-4 n-3 n-2 n-1 n
        pages.push('ellipsis', total - 4, total - 3, total - 2, total - 1, total)
    } else {
        // Middle: 1 ... c-1 c c+1 ... last
        pages.push('ellipsis', current - 1, current, current + 1, 'ellipsis', total)
    }

    return pages
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) {
        return null
    }

    const pageNumbers = getPageNumbers(page, totalPages)

    return (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            {/* Page info */}
            <p className="text-sm text-muted-foreground">
                Page <span className="font-medium text-neutral-900">{page}</span> of{' '}
                <span className="font-medium text-neutral-900">{totalPages}</span>
            </p>

            {/* Navigation */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(1)}
                    disabled={page <= 1}
                >
                    <ChevronsLeft className="w-4 h-4" />
                    <span className="sr-only">First page</span>
                </Button>

                {/* Previous page */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="sr-only">Previous page</span>
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                    {pageNumbers.map((pageNum, idx) =>
                        pageNum === 'ellipsis' ? (
                            <span
                                key={`ellipsis-${String(idx)}`}
                                className="px-2 text-muted-foreground"
                            >
                                ...
                            </span>
                        ) : (
                            <Button
                                key={pageNum}
                                variant={page === pageNum ? 'default' : 'ghost'}
                                size="sm"
                                className={cn(
                                    'h-8 w-8 p-0',
                                    page === pageNum && 'pointer-events-none'
                                )}
                                onClick={() => onPageChange(pageNum)}
                            >
                                {pageNum}
                            </Button>
                        )
                    )}
                </div>

                {/* Next page */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    <ChevronRight className="w-4 h-4" />
                    <span className="sr-only">Next page</span>
                </Button>

                {/* Last page */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(totalPages)}
                    disabled={page >= totalPages}
                >
                    <ChevronsRight className="w-4 h-4" />
                    <span className="sr-only">Last page</span>
                </Button>
            </div>
        </div>
    )
}
