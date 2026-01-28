'use client'

import { useParams } from 'next/navigation'
import { useAppDetails } from '@/hooks/useApp'
import { PlatformBadge } from '@/components/apps'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@bundlenudge/shared-ui'
import { ErrorState } from '@/components/shared/ErrorState'

export default function AppDetailPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const appId = params.appId as string

    const { data, isLoading, isError, error, refetch } = useAppDetails(accountId, appId)

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error?.message ?? 'Failed to load app'}
                    onRetry={() => void refetch()}
                />
            </div>
        )
    }

    const app = data?.app

    if (!app) {
        return (
            <div className="p-6">
                <ErrorState message="App not found" />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold">{app.name}</h1>
                        <PlatformBadge platform={app.platform} />
                    </div>
                    {app.bundleId && (
                        <p className="text-gray-600 font-mono text-sm">{app.bundleId}</p>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Active Devices
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {app.stats?.activeDevices ?? 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Total Releases
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {app.stats?.totalReleases ?? 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Downloads This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {app.stats?.downloadsThisMonth ?? 0}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">
                        More app management features coming soon...
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
