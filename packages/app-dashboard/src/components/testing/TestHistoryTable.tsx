'use client'

/**
 * TestHistoryTable Component
 *
 * Displays a table of recent test results with filtering.
 */

import { useState } from 'react'
import { History, CheckCircle, XCircle, Clock, AlertTriangle, Filter } from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    cn,
} from '@bundlenudge/shared-ui'
import type { TestResult, TestStatus } from './TestResultCard'

// =============================================================================
// Types
// =============================================================================

interface TestHistoryTableProps {
    tests: TestResult[]
    onViewDetails?: (testId: string) => void
    className?: string
}

// =============================================================================
// Helpers
// =============================================================================

function getStatusIcon(status: TestStatus, className?: string) {
    const iconClass = cn('w-4 h-4', className)
    switch (status) {
        case 'success':
            return <CheckCircle className={cn(iconClass, 'text-green-500')} />
        case 'failed':
            return <XCircle className={cn(iconClass, 'text-red-500')} />
        case 'pending':
            return <Clock className={cn(iconClass, 'text-amber-500')} />
        case 'warning':
            return <AlertTriangle className={cn(iconClass, 'text-amber-500')} />
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

function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${String(minutes)}m ago`
    if (hours < 24) return `${String(hours)}h ago`
    return new Date(timestamp).toLocaleDateString()
}

interface TestRowProps {
    test: TestResult
    onViewDetails?: (testId: string) => void
}

function TestRow({ test, onViewDetails }: TestRowProps) {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium text-sm">
                        {formatTestType(test.testType)}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <span className="text-sm text-muted-foreground font-mono">
                    {test.deviceName || test.deviceId.slice(0, 12)}...
                </span>
            </TableCell>
            <TableCell>
                <span className="font-mono text-sm">{test.version}</span>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="capitalize text-xs">
                    {test.channel}
                </Badge>
            </TableCell>
            <TableCell>
                <span className="text-sm text-muted-foreground">
                    {formatDuration(test.duration)}
                </span>
            </TableCell>
            <TableCell>
                <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(test.timestamp)}
                </span>
            </TableCell>
            <TableCell>
                {onViewDetails && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(test.id)}
                    >
                        View
                    </Button>
                )}
            </TableCell>
        </TableRow>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                <History className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-muted-foreground">
                No test history yet. Run a test to see results here.
            </p>
        </div>
    )
}

export function TestHistoryTable({
    tests,
    onViewDetails,
    className,
}: TestHistoryTableProps) {
    const [statusFilter, setStatusFilter] = useState<TestStatus | 'all'>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const filteredTests = tests.filter((test) => {
        if (statusFilter !== 'all' && test.status !== statusFilter) return false
        if (typeFilter !== 'all' && test.testType !== typeFilter) return false
        return true
    })

    const testTypes = [...new Set(tests.map((t) => t.testType))]

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="w-4 h-4 text-neutral-500" />
                        Test History
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-400" />
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as TestStatus | 'all')}
                        >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                            </SelectContent>
                        </Select>
                        {testTypes.length > 1 && (
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {testTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {formatTestType(type)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {filteredTests.length === 0 ? (
                    <EmptyState />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test</TableHead>
                                <TableHead>Device</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTests.slice(0, 10).map((test) => (
                                <TestRow
                                    key={test.id}
                                    test={test}
                                    onViewDetails={onViewDetails}
                                />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
