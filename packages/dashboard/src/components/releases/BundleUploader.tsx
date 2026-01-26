'use client'

/**
 * BundleUploader Component
 *
 * Drag and drop file uploader for bundle files (.zip, .bundle).
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface BundleUploaderProps {
    onUpload: (file: File) => Promise<void>
    maxSizeMB?: number
    acceptedTypes?: string[]
    className?: string
}

interface FileInfo {
    file: File
    status: UploadStatus
    progress: number
    error?: string
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

function validateFile(file: File, maxSizeMB: number, acceptedTypes: string[]): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const extension = '.' + ext
    if (!acceptedTypes.includes(extension)) {
        return `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large. Maximum size: ${maxSizeMB}MB`
    }
    return null
}

export function BundleUploader({
    onUpload,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    className,
}: BundleUploaderProps) {
    const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(async (file: File) => {
        const validationError = validateFile(file, maxSizeMB, acceptedTypes)
        if (validationError) {
            setFileInfo({ file, status: 'error', progress: 0, error: validationError })
            return
        }

        setFileInfo({ file, status: 'uploading', progress: 0 })

        try {
            const progressInterval = setInterval(() => {
                setFileInfo((prev) => {
                    if (!prev || prev.progress >= 90) return prev
                    return { ...prev, progress: prev.progress + 10 }
                })
            }, 200)

            await onUpload(file)
            clearInterval(progressInterval)
            setFileInfo((prev) => (prev ? { ...prev, status: 'success', progress: 100 } : null))
        } catch (err) {
            setFileInfo((prev) =>
                prev ? { ...prev, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' } : null
            )
        }
    }, [onUpload, maxSizeMB, acceptedTypes])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) void handleFile(droppedFile)
    }, [handleFile])

    const handleClear = useCallback(() => {
        setFileInfo(null)
        if (inputRef.current) inputRef.current.value = ''
    }, [])

    const isUploading = fileInfo?.status === 'uploading'

    return (
        <div className={cn('space-y-4', className)}>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 transition-colors',
                    'flex flex-col items-center justify-center text-center',
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                    isUploading && 'pointer-events-none opacity-60'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptedTypes.join(',')}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                />
                <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Drop your bundle file here</p>
                <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
                <p className="text-xs text-muted-foreground">{acceptedTypes.join(', ')} up to {maxSizeMB}MB</p>
            </div>

            {fileInfo && <FileInfoDisplay fileInfo={fileInfo} onClear={handleClear} />}
        </div>
    )
}

function FileInfoDisplay({ fileInfo, onClear }: { fileInfo: FileInfo; onClear: () => void }) {
    const { file, status, progress, error } = fileInfo

    return (
        <div className={cn(
            'rounded-lg border p-4',
            status === 'error' && 'border-red-200 bg-red-50',
            status === 'success' && 'border-green-200 bg-green-50'
        )}>
            <div className="flex items-start gap-3">
                <FileStatusIcon status={status} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    {status === 'uploading' && (
                        <div className="mt-2">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{progress}% uploaded</p>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                </div>
                {status !== 'uploading' && (
                    <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}

function FileStatusIcon({ status }: { status: UploadStatus }) {
    const iconClass = 'w-8 h-8 p-1.5 rounded-lg'

    switch (status) {
        case 'uploading':
            return <div className={cn(iconClass, 'bg-primary/10 text-primary')}><Upload className="w-full h-full animate-pulse" /></div>
        case 'success':
            return <div className={cn(iconClass, 'bg-green-100 text-green-600')}><CheckCircle className="w-full h-full" /></div>
        case 'error':
            return <div className={cn(iconClass, 'bg-red-100 text-red-600')}><AlertCircle className="w-full h-full" /></div>
        default:
            return <div className={cn(iconClass, 'bg-muted text-muted-foreground')}><File className="w-full h-full" /></div>
    }
}
