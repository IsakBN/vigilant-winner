'use client'

/**
 * Admin System Configuration Page
 *
 * Configure system-wide settings for email, rate limiting, security, and storage.
 */

import { Skeleton } from '@/components/ui/skeleton'
import { EmailConfigSection } from './EmailConfigSection'
import { RateLimitConfigSection } from './RateLimitConfigSection'
import { SecurityConfigSection } from './SecurityConfigSection'
import { StorageConfigSection } from './StorageConfigSection'
import { useSystemConfig } from '@/hooks/useAdmin'

export default function AdminConfigPage() {
    const { data, isLoading, error } = useSystemConfig()

    if (isLoading) {
        return <ConfigPageSkeleton />
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="text-destructive">
                    Failed to load system configuration. Please try again.
                </div>
            </div>
        )
    }

    const config = data?.config

    if (!config) {
        return null
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">System Configuration</h1>
                <p className="text-muted-foreground mt-1">
                    Configure system-wide settings for your BundleNudge instance.
                </p>
            </div>

            <div className="space-y-6">
                <EmailConfigSection config={config.email} />
                <RateLimitConfigSection config={config.rateLimit} />
                <SecurityConfigSection config={config.security} />
                <StorageConfigSection config={config.storage} />
            </div>

            {config.updatedAt && (
                <div className="text-sm text-muted-foreground">
                    Last updated:{' '}
                    {new Date(config.updatedAt).toLocaleString()}
                    {config.updatedBy && ` by ${config.updatedBy}`}
                </div>
            )}
        </div>
    )
}

function ConfigPageSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border rounded-lg p-6">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-72 mt-2" />
                        <div className="mt-4 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
