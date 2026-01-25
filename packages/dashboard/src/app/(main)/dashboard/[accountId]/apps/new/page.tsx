'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { CreateAppForm } from '@/components/apps/CreateAppForm'
import { useCreateApp } from '@/hooks/useCreateApp'
import { ApiClientError } from '@/lib/api/client'

// =============================================================================
// Types
// =============================================================================

interface PageProps {
    params: Promise<{ accountId: string }>
}

// =============================================================================
// Page Component
// =============================================================================

export default function CreateAppPage({ params }: PageProps) {
    const { accountId } = use(params)
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const { mutate: createApp, isPending } = useCreateApp({
        accountId,
        onSuccess: (data) => {
            router.push(`/dashboard/${accountId}/apps/${data.app.id}`)
        },
        onError: (err: ApiClientError) => {
            setError(err.message || 'Failed to create app. Please try again.')
        },
    })

    return (
        <div className="min-h-screen bg-cream-bg">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Link
                    href={`/dashboard/${accountId}/apps`}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Apps
                </Link>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="text-2xl">Create New App</CardTitle>
                        <CardDescription>
                            Set up a new app to start deploying OTA updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CreateAppForm
                            onSubmit={createApp}
                            isLoading={isPending}
                            error={error}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
