'use client'

/**
 * BundleUploader Component
 *
 * Drag and drop file uploader for bundle files (.zip, .bundle).
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react'
import { cn, Button } from '@bundlenudge/shared-ui'

type UploadStatus = 'idle' | 'selected' | 'error'

interface BundleUploaderProps {
    file: File | null
    onFileSelect: (file: File | null) => void
    error?: string
    maxSizeMB?: number
    acceptedTypes?: string[]
    className?: string
}

const DEFAULT_MAX_SIZE_MB = 50
const DEFAULT_ACCEPTED_TYPES = ['.zip', '.bundle']

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function validateFile(
    file: File,
    maxSizeMB: number,
    acceptedTypes: string[]
): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const extension = '.' + ext
    if (!acceptedTypes.includes(extension)) {
        return `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large. Maximum size: ${String(maxSizeMB)}MB`
    }
    return null
}

export function BundleUploader({
    file,
    onFileSelect,
    error,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    className,
}: BundleUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const displayError = error ?? localError

    const handleFile = useCallback(
        (selectedFile: File) => {
            const validationError = validateFile(
                selectedFile,
                maxSizeMB,
                acceptedTypes
            )
            if (validationError) {
                setLocalError(validationError)
                onFileSelect(null)
                return
            }
            setLocalError(null)
            onFileSelect(selectedFile)
        },
        [maxSizeMB, acceptedTypes, onFileSelect]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile) handleFile(droppedFile)
        },
        [handleFile]
    )

    const handleClear = useCallback(() => {
        onFileSelect(null)
        setLocalError(null)
        if (inputRef.current) inputRef.current.value = ''
    }, [onFileSelect])

    const _status: UploadStatus = displayError ? 'error' : file ? 'selected' : 'idle'

    return (
        <div className={cn('space-y-4', className)}>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                }}
                onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                }}
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 transition-colors',
                    'flex flex-col items-center justify-center text-center',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                    file && 'border-green-300 bg-green-50'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptedTypes.join(',')}
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFile(f)
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                    <SelectedFileDisplay file={file} onClear={handleClear} />
                ) : (
                    <DropZoneContent
                        acceptedTypes={acceptedTypes}
                        maxSizeMB={maxSizeMB}
                    />
                )}
            </div>

            {displayError && (
                <ErrorDisplay message={displayError} />
            )}
        </div>
    )
}

function DropZoneContent({
    acceptedTypes,
    maxSizeMB,
}: {
    acceptedTypes: string[]
    maxSizeMB: number
}) {
    return (
        <>
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">
                Drop your bundle file here
            </p>
            <p className="text-xs text-muted-foreground mb-3">
                or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
                {acceptedTypes.join(', ')} up to {String(maxSizeMB)}MB
            </p>
        </>
    )
}

function SelectedFileDisplay({
    file,
    onClear,
}: {
    file: File
    onClear: () => void
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-green-700" />
                <p className="text-sm font-medium text-green-700">{file.name}</p>
            </div>
            <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation()
                    onClear()
                }}
                className="mt-2"
            >
                <X className="w-4 h-4 mr-1" />
                Remove
            </Button>
        </div>
    )
}

function ErrorDisplay({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
        </div>
    )
}
