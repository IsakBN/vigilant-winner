'use client'

/**
 * BuildArtifacts Component
 *
 * Displays downloadable build artifacts with size information.
 */

import { FileArchive, Download, FileCode, FileText, File } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@bundlenudge/shared-ui'
import type { BuildArtifact } from '@/lib/api/builds'
import { builds } from '@/lib/api/builds'

interface BuildArtifactsProps {
    artifacts: BuildArtifact[]
    accountId: string
    appId: string
    buildId: string
    className?: string
}

function formatSize(bytes: number | null): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${String(bytes)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getArtifactIcon(type: BuildArtifact['type']) {
    switch (type) {
        case 'bundle':
            return FileArchive
        case 'sourcemap':
            return FileCode
        case 'manifest':
            return FileText
        case 'log':
            return FileText
        default:
            return File
    }
}

function getArtifactLabel(type: BuildArtifact['type']): string {
    switch (type) {
        case 'bundle':
            return 'Bundle'
        case 'sourcemap':
            return 'Source Map'
        case 'manifest':
            return 'Manifest'
        case 'log':
            return 'Build Log'
        default:
            return 'File'
    }
}

interface ArtifactRowProps {
    artifact: BuildArtifact
    downloadUrl: string
}

function ArtifactRow({ artifact, downloadUrl }: ArtifactRowProps) {
    const Icon = getArtifactIcon(artifact.type)
    const typeLabel = getArtifactLabel(artifact.type)

    return (
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-neutral-400" />
                <div>
                    <p className="text-sm font-medium text-neutral-900">
                        {artifact.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{typeLabel}</span>
                        <span>-</span>
                        <span>{formatSize(artifact.size)}</span>
                    </div>
                </div>
            </div>
            <a
                href={downloadUrl}
                download
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 rounded-md transition-colors"
                title={`Download ${artifact.name}`}
            >
                <Download className="w-4 h-4" />
            </a>
        </div>
    )
}

export function BuildArtifacts({
    artifacts,
    accountId,
    appId,
    buildId,
    className,
}: BuildArtifactsProps) {
    if (artifacts.length === 0) {
        return null
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    <FileArchive className="w-4 h-4" />
                    Artifacts ({String(artifacts.length)})
                </h3>
            </CardHeader>
            <CardContent className="space-y-2">
                {artifacts.map((artifact) => (
                    <ArtifactRow
                        key={artifact.id}
                        artifact={artifact}
                        downloadUrl={builds.getArtifactUrl(accountId, appId, buildId, artifact.id)}
                    />
                ))}
            </CardContent>
        </Card>
    )
}
