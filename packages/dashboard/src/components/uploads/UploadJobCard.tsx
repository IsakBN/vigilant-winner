'use client'

/**
 * UploadJobCard Component
 *
 * Displays individual upload job with status, timestamps, and actions.
 */

import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { UploadJob, UploadJobStatus } from '@/hooks/useUploadJobs'

// =============================================================================
// Types
// =============================================================================

interface UploadJobCardProps {
    job: UploadJob
    onCancel?: (jobId: string) => void
    isCancelling?: boolean
}

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<UploadJobStatus, { label: string; className: string }> = {
    queued: {
        label: 'Queued',
        className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    },
    processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse',
    },
    completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-700 border-red-200',
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-neutral-50 text-neutral-400 border-neutral-200',
    },
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatRelativeTime(timestamp: string): string {
    const now = Date.now()
    const time = new Date(timestamp).getTime()
    const diff = now - time

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${String(days)} day${days !== 1 ? 's' : ''} ago`
    if (hours > 0) return `${String(hours)} hour${hours !== 1 ? 's' : ''} ago`
    if (minutes > 0) return `${String(minutes)} minute${minutes !== 1 ? 's' : ''} ago`
    if (seconds > 10) return `${String(seconds)} seconds ago`
    return 'just now'
}

function truncateJobId(jobId: string): string {
    if (jobId.length <= 12) return jobId
    return `${jobId.slice(0, 8)}...${jobId.slice(-4)}`
}

// =============================================================================
// Component
// =============================================================================

export function UploadJobCard({ job, onCancel, isCancelling }: UploadJobCardProps) {
    const statusConfig = STATUS_CONFIG[job.status]
    const canCancel = job.status === 'queued' && onCancel

    return (
        <Card className="hover:border-neutral-300 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <code className="text-sm font-mono text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded">
                                {truncateJobId(job.id)}
                            </code>
                            <Badge className={`${statusConfig.className} border`}>
                                {statusConfig.label}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                            <span className="font-mono">{job.version}</span>
                            <span className="text-neutral-300">|</span>
                            <span>{job.appName}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span>Queued {formatRelativeTime(job.queuedAt)}</span>
                            {job.startedAt && (
                                <>
                                    <span className="text-neutral-300">|</span>
                                    <span>Started {formatRelativeTime(job.startedAt)}</span>
                                </>
                            )}
                            {job.completedAt && (
                                <>
                                    <span className="text-neutral-300">|</span>
                                    <span>
                                        {job.status === 'completed' ? 'Completed' : 'Ended'}{' '}
                                        {formatRelativeTime(job.completedAt)}
                                    </span>
                                </>
                            )}
                        </div>

                        {job.status === 'failed' && job.error && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-100 text-sm text-red-700 rounded">
                                {job.error}
                            </div>
                        )}
                    </div>

                    {canCancel && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCancel(job.id)}
                            disabled={isCancelling}
                            className="text-neutral-600 hover:text-red-600 hover:border-red-200"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Cancelling
                                </>
                            ) : (
                                <>
                                    <X className="w-3 h-3 mr-1" />
                                    Cancel
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
