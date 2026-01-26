'use client'

/**
 * UploadProgress Component - Displays upload progress with percentage and status
 */

import { CheckCircle, XCircle, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

// =============================================================================
// Types
// =============================================================================

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadProgressProps {
    state: UploadState
    progress: number
    fileName?: string
    fileSize?: number
    error?: string
    onRetry?: () => void
    onCancel?: () => void
    className?: string
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// =============================================================================
// Main Component
// =============================================================================

export function UploadProgress({
    state,
    progress,
    fileName,
    fileSize,
    error,
    onRetry,
    onCancel,
    className,
}: UploadProgressProps) {
    const iconBgClass = {
        success: 'bg-green-100',
        error: 'bg-red-100',
        idle: 'bg-neutral-100',
        uploading: 'bg-neutral-100',
    }[state]

    const statusText = {
        uploading: `Uploading... ${progress}%`,
        success: 'Upload complete',
        error: error || 'Upload failed',
        idle: fileSize ? formatFileSize(fileSize) : '',
    }[state]

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', iconBgClass)}>
                    {state === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {state === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                    {state === 'uploading' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                    {state === 'idle' && <Upload className="w-5 h-5 text-neutral-400" />}
                </div>

                <div className="flex-1 min-w-0">
                    {fileName && (
                        <p className="text-sm font-medium text-neutral-900 truncate">{fileName}</p>
                    )}
                    <p className="text-xs text-neutral-500">{statusText}</p>
                </div>

                <div className="flex-shrink-0">
                    {state === 'uploading' && onCancel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            className="text-neutral-500 hover:text-red-600"
                        >
                            Cancel
                        </Button>
                    )}
                    {state === 'error' && onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                            Retry
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {(state === 'uploading' || state === 'success' || state === 'error') && (
                <div
                    className={cn(
                        'w-full h-2 rounded-full overflow-hidden',
                        state === 'success' ? 'bg-green-100' : state === 'error' ? 'bg-red-100' : 'bg-neutral-100'
                    )}
                >
                    <div
                        className={cn(
                            'h-full transition-all duration-300',
                            state === 'success' ? 'bg-green-500 w-full' : state === 'error' ? 'bg-red-500 w-full' : 'bg-primary'
                        )}
                        style={state === 'uploading' ? { width: `${progress}%` } : undefined}
                    />
                </div>
            )}
        </div>
    )
}

// =============================================================================
// Compact variant
// =============================================================================

export function UploadProgressCompact({
    progress,
    isUploading,
    className,
}: {
    progress: number
    isUploading: boolean
    className?: string
}) {
    if (!isUploading) return null

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-mono text-neutral-500 w-10 text-right">{progress}%</span>
        </div>
    )
}

// =============================================================================
// Multi-file upload progress
// =============================================================================

interface FileUploadItem {
    id: string
    fileName: string
    fileSize: number
    state: UploadState
    progress: number
    error?: string
}

export function MultiUploadProgress({
    files,
    onRetry,
    onRemove,
    className,
}: {
    files: FileUploadItem[]
    onRetry?: (fileId: string) => void
    onRemove?: (fileId: string) => void
    className?: string
}) {
    const completedCount = files.filter((f) => f.state === 'success').length
    const totalCount = files.length

    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">
                    {completedCount} of {totalCount} files uploaded
                </span>
                <span className="text-neutral-500">{Math.round((completedCount / totalCount) * 100)}%</span>
            </div>
            <div className="space-y-2">
                {files.map((file) => (
                    <UploadProgress
                        key={file.id}
                        state={file.state}
                        progress={file.progress}
                        fileName={file.fileName}
                        fileSize={file.fileSize}
                        error={file.error}
                        onRetry={onRetry ? () => onRetry(file.id) : undefined}
                        onCancel={onRemove ? () => onRemove(file.id) : undefined}
                    />
                ))}
            </div>
        </div>
    )
}
