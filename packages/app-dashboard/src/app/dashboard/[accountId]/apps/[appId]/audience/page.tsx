'use client'

/**
 * Audience Page
 *
 * Manages testers and displays device audience for an app.
 */

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useDevices, useTesters } from '@/hooks'
import {
    AudienceHeader,
    AudienceSkeleton,
    TestersTab,
    DevicesTab,
} from '@/components/audience'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'

export default function AudiencePage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()

    const accountId = params.accountId as string
    const appId = params.appId as string
    const currentTab = searchParams.get('tab') ?? 'testers'

    // Fetch counts for header
    const { testers, isLoading: testersLoading } = useTesters(accountId, appId)
    const { pagination, isLoading: devicesLoading } = useDevices(accountId, appId, {
        limit: 1,
    })

    function handleTabChange(value: string) {
        router.push(`/dashboard/${accountId}/apps/${appId}/audience?tab=${value}`)
    }

    const isLoading = testersLoading || devicesLoading

    if (isLoading) {
        return (
            <div>
                <AudienceHeader testerCount={0} deviceCount={0} />
                <AudienceSkeleton />
            </div>
        )
    }

    return (
        <div>
            <AudienceHeader
                testerCount={testers.length}
                deviceCount={pagination?.total ?? 0}
            />

            <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="testers">Testers</TabsTrigger>
                    <TabsTrigger value="devices">SDK Devices</TabsTrigger>
                </TabsList>

                <TabsContent value="testers" className="mt-6">
                    <TestersTab accountId={accountId} appId={appId} />
                </TabsContent>

                <TabsContent value="devices" className="mt-6">
                    <DevicesTab accountId={accountId} appId={appId} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
