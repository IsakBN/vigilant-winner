'use client'

/**
 * TestResultCard Component
 *
 * Displays the result of a test rollout or update check.
 */

import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    cn,
} from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

type TestStatus = 'success' | 'failed' | 'pending' | 'warning'

interface TestResult {
    id: string
    testType: 'update_check' | 'rollout' | 'download' | 'install'
    status: TestStatus
    deviceId: string
    deviceName?: string
    version: string
    channel: string
    timestamp: number
    duration: number
    error?: string
    details?: Record<string, unknown>
}

interface TestResultCardProps {
    result: TestResult
    className?: string
}

// =============================================================================
// Helpers
// =============================================================================

function getStatusIcon(status: TestStatus) {
    switch (status) {
        case 'success':
            return <CheckCircle className="w-5 h-5 text-green-500" />
        case 'failed':
            return <XCircle className="w-5 h-5 text-red-500" />
        case 'pending':
            return <Clock className="w-5 h-5 text-amber-500" />
        case 'warning':
            return <AlertTriangle className="w-5 h-5 text-amber-500" />
    }
}

function getStatusBadgeVariant(status: TestStatus) {
    switch (status) {
        case 'success':
            return 'default' as const
        case 'failed':
            return 'destructive' as const
        case 'pending':
            return 'secondary' as const
        case 'warning':
            return 'outline' as const
    }
}

function formatTestType(type: string): string {
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${String(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
}

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

// =============================================================================
// Component
// =============================================================================

export function TestResultCard({ result, className }: TestResultCardProps) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                            <CardTitle className="text-sm font-medium">
                                {formatTestType(result.testType)}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {result.deviceName || result.deviceId.slice(0, 16)}
                            </p>
                        </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(result.status)}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Version</p>
                        <p className="font-mono text-neutral-900">{result.version}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Channel</p>
                        <p className="capitalize text-neutral-900">{result.channel}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                        <p className="text-neutral-900">{formatDuration(result.duration)}</p>
                    </div>
                </div>

                {result.error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs text-red-700">{result.error}</p>
                    </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Test ID: {result.id.slice(0, 8)}</span>
                    <span>{formatTimestamp(result.timestamp)}</span>
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Export Types
// =============================================================================

export type { TestResult, TestStatus }
