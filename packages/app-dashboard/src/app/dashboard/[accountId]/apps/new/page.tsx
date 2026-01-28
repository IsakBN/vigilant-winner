'use client'

import { useParams, useRouter } from 'next/navigation'
import { CreateAppForm } from '@/components/apps'
import { useCreateApp } from '@/hooks/useApps'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@bundlenudge/shared-ui'

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
                <h1 className="text-2xl font-bold">Create New App</h1>
                <p className="text-gray-600">Set up a new app for OTA updates</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>App Details</CardTitle>
                    <CardDescription>
                        Enter the basic information about your app
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateAppForm
                        onSubmit={handleSubmit}
                        isLoading={createApp.isPending}
                        error={createApp.error?.message}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
