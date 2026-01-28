'use client'

/**
 * App Settings Page
 *
 * Comprehensive settings page with sections for:
 * - General settings (app name, bundle ID - read only)
 * - API Key management
 * - Danger zone (delete app)
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'
import { useAppDetails, useUpdateApp, useDeleteAppById, useRegenerateApiKey } from '@/hooks/useApp'
import { ErrorState } from '@/components/shared/ErrorState'
import {
    ApiKeySection,
    AppSettingsForm,
    AppSettingsSkeleton,
    DeleteAppDialog,
} from '@/components/apps'

export default function AppSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const accountId = params.accountId as string
    const appId = params.appId as string

    const { data, isLoading, isError, error, refetch } = useAppDetails(accountId, appId)
    const updateApp = useUpdateApp(accountId, appId)
    const deleteApp = useDeleteAppById(accountId, appId)
    const regenerateKey = useRegenerateApiKey(accountId, appId)

    const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)

    const handleUpdateApp = async (data: { name: string }) => {
        await updateApp.mutateAsync(data)
    }

    const handleDelete = async () => {
        await deleteApp.mutateAsync()
        router.push(`/dashboard/${accountId}`)
    }

    const handleRegenerateKey = async () => {
        const result = await regenerateKey.mutateAsync()
        setGeneratedApiKey(result.apiKey)
    }

    if (isLoading) {
        return <AppSettingsSkeleton />
    }

    if (isError) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error?.message ?? 'Failed to load app settings'}
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

    const displayApiKey = generatedApiKey ?? app.apiKey ?? null

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your app configuration and API keys
                </p>
            </div>

            {/* General Settings */}
            <AppSettingsForm
                currentName={app.name}
                currentBundleId={app.bundleId}
                isSaving={updateApp.isPending}
                onSave={handleUpdateApp}
            />

            {/* API Key Section */}
            <ApiKeySection
                apiKey={displayApiKey}
                isRegenerating={regenerateKey.isPending}
                onRegenerate={handleRegenerateKey}
            />

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions that will permanently affect your app.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h4 className="font-medium">Delete this app</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Once deleted, all releases, devices, and data will be
                                permanently removed. This action cannot be undone.
                            </p>
                        </div>
                        <DeleteAppDialog
                            appName={app.name}
                            onConfirm={handleDelete}
                            isPending={deleteApp.isPending}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
