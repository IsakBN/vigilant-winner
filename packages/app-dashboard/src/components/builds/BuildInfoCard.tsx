'use client'

/**
 * BuildInfoCard Component
 *
 * Displays build metadata: platform, size, duration, dates, git info.
 */

import { Clock, GitBranch, GitCommit } from 'lucide-react'
import { Card, CardContent } from '@bundlenudge/shared-ui'
import type { Build } from '@/lib/api/builds'

interface BuildInfoCardProps {
    build: Build
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatDuration(startMs: number | null, endMs: number | null): string {
    if (!startMs) return '-'
    const end = endMs ?? Date.now()
    const seconds = Math.floor((end - startMs) / 1000)

    if (seconds < 60) return `${String(seconds)} seconds`

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${String(minutes)}m ${String(remainingSeconds)}s`
}

function formatSize(bytes: number | null): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${String(bytes)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface InfoItemProps {
    label: string
    value: React.ReactNode
    icon?: React.ReactNode
}

function InfoItem({ label, value, icon }: InfoItemProps) {
    return (
        <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                {label}
            </dt>
            <dd className="flex items-center gap-2 text-sm text-neutral-900">
                {icon}
                {value}
            </dd>
        </div>
    )
}

export function BuildInfoCard({ build }: BuildInfoCardProps) {
    const hasGitInfo = build.sourceBranch || build.sourceCommit

    return (
        <Card>
            <CardContent className="p-6">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem
                        label="Platform"
                        value={build.platform.toUpperCase()}
                    />
                    <InfoItem
                        label="Bundle Size"
                        value={formatSize(build.bundleSize)}
                    />
                    <InfoItem
                        label="Duration"
                        value={formatDuration(build.startedAt, build.completedAt)}
                        icon={<Clock className="w-4 h-4 text-neutral-400" />}
                    />
                    <InfoItem
                        label="Created"
                        value={formatDate(build.createdAt)}
                    />
                </dl>

                {hasGitInfo && (
                    <>
                        <hr className="my-6 border-neutral-200" />
                        <dl className="grid grid-cols-2 gap-6">
                            {build.sourceBranch && (
                                <InfoItem
                                    label="Branch"
                                    value={build.sourceBranch}
                                    icon={<GitBranch className="w-4 h-4 text-neutral-400" />}
                                />
                            )}
                            {build.sourceCommit && (
                                <InfoItem
                                    label="Commit"
                                    value={
                                        <code className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                                            {build.sourceCommit.slice(0, 8)}
                                        </code>
                                    }
                                    icon={<GitCommit className="w-4 h-4 text-neutral-400" />}
                                />
                            )}
                        </dl>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
