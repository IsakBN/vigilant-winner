'use client'

/**
 * UploadJobsList Component
 *
 * Displays a list of upload jobs with loading and empty states.
 */

import { Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UploadJobCard } from './UploadJobCard'
import type { UploadJob } from '@/hooks/useUploadJobs'

// =============================================================================
// Types
// =============================================================================

interface UploadJobsListProps {
    jobs: UploadJob[]
    isLoading?: boolean
    onCancel?: (jobId: string) => void
    cancellingJobId?: string
}

// =============================================================================
// Skeleton Component
// =============================================================================

function UploadJobsSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-6 w-28" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
                    <Upload className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    No upload jobs
                </h3>
                <p className="text-sm text-neutral-500 text-center max-w-sm">
                    Upload jobs will appear here when you upload bundles to your apps.
                </p>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Main Component
// =============================================================================

export function UploadJobsList({
    jobs,
    isLoading,
    onCancel,
    cancellingJobId,
}: UploadJobsListProps) {
    if (isLoading) {
        return <UploadJobsSkeleton />
    }

    if (jobs.length === 0) {
        return <EmptyState />
    }

    return (
        <div className="space-y-4">
            {jobs.map((job) => (
                <UploadJobCard
                    key={job.id}
                    job={job}
                    onCancel={onCancel}
                    isCancelling={cancellingJobId === job.id}
                />
            ))}
        </div>
    )
}
