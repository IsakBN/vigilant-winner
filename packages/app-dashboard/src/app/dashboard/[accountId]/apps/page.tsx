'use client'

import { useParams, useRouter } from 'next/navigation'
import { AppList } from '@/components/apps'

export default function AppsPage() {
    const params = useParams()
    const router = useRouter()
    const accountId = params.accountId as string

    const handleCreateApp = () => {
        router.push(`/dashboard/${accountId}/apps/new`)
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Apps</h1>
                    <p className="text-gray-600">Manage your React Native apps</p>
                </div>
            </div>
            <AppList accountId={accountId} onCreateApp={handleCreateApp} />
        </div>
    )
}
