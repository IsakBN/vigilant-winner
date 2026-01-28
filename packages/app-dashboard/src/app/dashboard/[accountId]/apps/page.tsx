'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@bundlenudge/shared-ui'
import { AppList } from '@/components/apps'
import { GitHubIcon } from '@/components/settings'

export default function AppsPage() {
    const params = useParams()
    const router = useRouter()
    const accountId = params.accountId as string

    const handleConnectRepo = () => {
        router.push(`/dashboard/${accountId}/apps/new`)
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Apps</h1>
                    <p className="text-gray-600">Manage your React Native apps</p>
                </div>
                <Button onClick={handleConnectRepo} className="gap-2">
                    <GitHubIcon />
                    Connect Repository
                </Button>
            </div>
            <AppList accountId={accountId} onCreateApp={handleConnectRepo} />
        </div>
    )
}
