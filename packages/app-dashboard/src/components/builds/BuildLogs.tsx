'use client'

/**
 * BuildLogs Component
 *
 * Displays build logs with auto-scroll and level-based coloring.
 */

import { useRef, useEffect, useState } from 'react'
import { AlertCircle, Info, AlertTriangle, Bug, ChevronDown } from 'lucide-react'
import { Button, Skeleton, cn } from '@bundlenudge/shared-ui'
import type { BuildLog } from '@/lib/api/builds'

interface BuildLogsProps {
    logs: BuildLog[]
    isLoading?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    autoScroll?: boolean
    className?: string
}

type LogLevel = BuildLog['level']

const LOG_LEVEL_CONFIG: Record<LogLevel, { icon: typeof Info; className: string }> = {
    info: { icon: Info, className: 'text-neutral-300' },
    warn: { icon: AlertTriangle, className: 'text-amber-400' },
    error: { icon: AlertCircle, className: 'text-red-400' },
    debug: { icon: Bug, className: 'text-neutral-500' },
}

function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
}

interface LogEntryProps {
    log: BuildLog
    showLevel?: boolean
}

function LogEntry({ log, showLevel = true }: LogEntryProps) {
    const config = LOG_LEVEL_CONFIG[log.level]
    const Icon = config.icon

    return (
        <div className={cn('flex items-start gap-2 py-1', config.className)}>
            <span className="flex-shrink-0 w-20 font-mono text-xs text-neutral-500">
                {formatTimestamp(log.timestamp)}
            </span>
            {showLevel && <Icon className="flex-shrink-0 w-4 h-4 mt-0.5" />}
            <span
                className={cn(
                    'flex-1 font-mono text-sm whitespace-pre-wrap break-all',
                    log.level === 'error' && 'text-red-400',
                    log.level === 'warn' && 'text-amber-400',
                    log.level === 'debug' && 'text-neutral-500',
                    log.level === 'info' && 'text-neutral-200'
                )}
            >
                {log.message}
            </span>
        </div>
    )
}

export function BuildLogs({
    logs,
    isLoading,
    hasMore,
    onLoadMore,
    autoScroll = true,
    className,
}: BuildLogsProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(autoScroll)
    const [showScrollButton, setShowScrollButton] = useState(false)

    useEffect(() => {
        if (isAutoScrollEnabled && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [logs, isAutoScrollEnabled])

    const handleScroll = () => {
        if (!containerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShowScrollButton(!isNearBottom)
        setIsAutoScrollEnabled(isNearBottom)
    }

    const scrollToBottom = () => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
            setIsAutoScrollEnabled(true)
        }
    }

    if (isLoading && logs.length === 0) return <BuildLogsSkeleton />

    return (
        <div className={cn('relative', className)}>
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-[400px] overflow-y-auto bg-neutral-900 text-neutral-100 rounded-lg p-4 font-mono text-sm"
            >
                {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                        No logs available
                    </div>
                ) : (
                    <>
                        {logs.map((log, index) => (
                            <LogEntry key={`${String(log.timestamp)}-${String(index)}`} log={log} />
                        ))}
                        {hasMore && onLoadMore && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onLoadMore}
                                    disabled={isLoading}
                                    className="bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                                >
                                    {isLoading ? 'Loading...' : 'Load More'}
                                </Button>
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex items-center gap-2 py-2 text-neutral-500">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                Loading...
                            </div>
                        )}
                    </>
                )}
            </div>
            {showScrollButton && (
                <Button
                    size="sm"
                    onClick={scrollToBottom}
                    className="absolute bottom-6 right-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 shadow-lg"
                >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    New logs
                </Button>
            )}
        </div>
    )
}

export function BuildLogsSkeleton() {
    return (
        <div className="h-[400px] bg-neutral-900 rounded-lg p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20 bg-neutral-800" />
                    <Skeleton className="h-4 w-4 bg-neutral-800" />
                    <Skeleton
                        className="h-4 bg-neutral-800"
                        style={{ width: `${String(40 + i * 5)}%` }}
                    />
                </div>
            ))}
        </div>
    )
}
