'use client'

/**
 * Upload Jobs Page
 *
 * Displays upload jobs with status filtering and real-time updates.
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Upload, RefreshCw } from 'lucide-react'
import { useUploadJobs, useCancelUploadJob } from '@/hooks/useUploadJobs'
import { UploadJobsList } from '@/components/uploads'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { UploadJobStatus } from '@/hooks/useUploadJobs'

// =============================================================================
// Types
// =============================================================================

type StatusFilter = UploadJobStatus | 'all'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'queued', label: 'Queued' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
]

// =============================================================================
// Page Header Component
// =============================================================================

interface PageHeaderProps {
    total: number
    isRefetching: boolean
    onRefresh: () => void
}

function PageHeader({ total, isRefetching, onRefresh }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                    <Upload className="w-6 h-6" />
                    Upload Jobs
                </h1>
                <p className="text-neutral-500 mt-1">
                    {total} job{total !== 1 ? 's' : ''} total
                </p>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefetching}
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
    )
}

// =============================================================================
// Error State Component
// =============================================================================

function ErrorState({ error }: { error: Error }) {
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Failed to load upload jobs:{' '}
            {error.message}
        </div>
    )
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function UploadsPage() {
    const params = useParams<{ accountId: string }>()
    const accountId = params.accountId

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [cancellingJobId, setCancellingJobId] = useState<string | undefined>()

    // Fetch upload jobs
    const { data, isLoading, error, refetch, isRefetching } = useUploadJobs(
        accountId,
        statusFilter
    )

    // Cancel mutation
    const cancelMutation = useCancelUploadJob(accountId)

    const handleCancel = (jobId: string) => {
        setCancellingJobId(jobId)
        cancelMutation.mutate(jobId, {
            onSettled: () => {
                setCancellingJobId(undefined)
            },
        })
    }

    const handleRefresh = () => {
        void refetch()
    }

    const handleStatusChange = (value: string) => {
        setStatusFilter(value as StatusFilter)
    }

    if (error) {
        return <ErrorState error={error} />
    }

    const jobs = data?.jobs ?? []
    const total = data?.pagination?.total ?? 0

    return (
        <div className="space-y-6">
            <PageHeader
                total={total}
                isRefetching={isRefetching}
                onRefresh={handleRefresh}
            />

            <Tabs value={statusFilter} onValueChange={handleStatusChange}>
                <TabsList className="mb-4">
                    {STATUS_TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {STATUS_TABS.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <UploadJobsList
                            jobs={jobs}
                            isLoading={isLoading}
                            onCancel={handleCancel}
                            cancellingJobId={cancellingJobId}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
