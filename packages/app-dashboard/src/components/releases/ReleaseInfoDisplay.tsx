'use client'

/**
 * ReleaseInfoDisplay Component
 *
 * Displays release information in a card layout (read-only view).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

interface ReleaseInfoDisplayProps {
    channel: string
    bundleSize: number | null
    minAppVersion: string | null
    maxAppVersion: string | null
    description: string | null
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A'
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
    return `${String(bytes)} B`
}

// =============================================================================
// Component
// =============================================================================

export function ReleaseInfoDisplay({
    channel,
    bundleSize,
    minAppVersion,
    maxAppVersion,
    description,
}: ReleaseInfoDisplayProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Release Info</CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <dt className="text-sm text-neutral-500">Channel</dt>
                        <dd className="text-sm font-medium text-neutral-900 capitalize">
                            {channel}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-neutral-500">Bundle Size</dt>
                        <dd className="text-sm font-medium text-neutral-900">
                            {formatFileSize(bundleSize)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-neutral-500">Min App Version</dt>
                        <dd className="text-sm font-medium text-neutral-900">
                            {minAppVersion || 'Any'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-neutral-500">Max App Version</dt>
                        <dd className="text-sm font-medium text-neutral-900">
                            {maxAppVersion || 'Any'}
                        </dd>
                    </div>
                </dl>
                {description && (
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                        <dt className="text-sm text-neutral-500 mb-1">Description</dt>
                        <dd className="text-sm text-neutral-700">{description}</dd>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
