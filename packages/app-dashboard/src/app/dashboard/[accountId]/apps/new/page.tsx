'use client'

import { useParams, useRouter } from 'next/navigation'
import { ConnectRepoForm } from '@/components/apps'
import { useCreateApp } from '@/hooks/useApps'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@bundlenudge/shared-ui'
import { GitHubIcon } from '@/components/settings'

export default function NewAppPage() {
    const params = useParams()
    const router = useRouter()
    const accountId = params.accountId as string

    const createApp = useCreateApp(accountId)

    const handleSubmit = (data: Parameters<typeof createApp.mutate>[0]) => {
        createApp.mutate(data, {
            onSuccess: (response) => {
                router.push(`/dashboard/${accountId}/apps/${response.app.id}`)
            },
        })
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="w-6 h-6">
                        <GitHubIcon />
                    </span>
                    Connect GitHub Repository
                </h1>
                <p className="text-gray-600">
                    Import a repository to enable OTA updates for your React Native app
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Repository Details</CardTitle>
                    <CardDescription>
                        Select a GitHub repository to connect with BundleNudge
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ConnectRepoForm
                        accountId={accountId}
                        onSubmit={handleSubmit}
                        isLoading={createApp.isPending}
                        error={createApp.error?.message}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
