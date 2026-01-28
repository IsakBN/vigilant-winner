'use client'

/**
 * Admin Audit Log Page
 *
 * System-wide audit log with filtering, pagination, and export.
 */

import { useState } from 'react'
import {
    Skeleton,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    ErrorState,
} from '@bundlenudge/shared-ui'
import { AuditLogTable, AuditLogFilters, AuditLogDetailModal } from '@/components/admin'
import { useAuditLogs, useExportAuditLogs } from '@/hooks/useAdmin'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ListAuditLogsParams, AuditLogEntry } from '@/lib/api'

const DEFAULT_LIMIT = 20

export default function AdminAuditPage() {
    const [filters, setFilters] = useState<ListAuditLogsParams>({
        page: 1,
        limit: DEFAULT_LIMIT,
    })
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

    const { data, isLoading, error, refetch } = useAuditLogs(filters)
    const exportLogs = useExportAuditLogs()

    const handleFiltersChange = (newFilters: ListAuditLogsParams) => {
        setFilters(newFilters)
    }

    const handleExport = () => {
        void exportLogs.mutateAsync(filters)
    }

    const handlePreviousPage = () => {
        if (filters.page && filters.page > 1) {
            setFilters({ ...filters, page: filters.page - 1 })
        }
    }

    const handleNextPage = () => {
        if (data?.hasMore) {
            setFilters({ ...filters, page: (filters.page || 1) + 1 })
        }
    }

    const handleRowClick = (log: AuditLogEntry) => {
        setSelectedLog(log)
    }

    const handleCloseModal = () => {
        setSelectedLog(null)
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message ?? 'Failed to load audit logs'}
                    onRetry={() => void refetch()}
                />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Audit Logs</h1>
                <p className="text-muted-foreground mt-1">
                    View and search system-wide audit logs for security and compliance.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <AuditLogFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onExport={handleExport}
                        isExporting={exportLogs.isPending}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Audit Log</CardTitle>
                    {data && (
                        <span className="text-sm text-muted-foreground">
                            {data.total} total entries
                        </span>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <AuditLogSkeleton />
                    ) : (
                        <AuditLogTable
                            logs={data?.logs || []}
                            onRowClick={handleRowClick}
                        />
                    )}

                    {data && data.total > 0 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Page {String(data.page)} of{' '}
                                {String(Math.ceil(data.total / data.limit))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={data.page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={!data.hasMore}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AuditLogDetailModal
                log={selectedLog}
                open={selectedLog !== null}
                onClose={handleCloseModal}
            />
        </div>
    )
}

function AuditLogSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b">
                    <Skeleton className="h-6 w-24" />
                    <div className="flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48 mt-1" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))}
        </div>
    )
}

