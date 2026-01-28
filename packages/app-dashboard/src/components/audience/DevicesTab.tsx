'use client'

/**
 * DevicesTab Component
 *
 * Tab content for displaying SDK devices.
 */

import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import {
    Card,
    CardContent,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'
import { useDevices, type DevicePlatform } from '@/hooks'
import { DeviceTable, DeviceTableSkeleton } from '@/components/devices'
import { DevicesInfoCard } from './DevicesInfoCard'
import { AudienceErrorState } from './AudienceErrorState'

// =============================================================================
// Types
// =============================================================================

type PlatformFilter = DevicePlatform | 'all'

interface DevicesTabProps {
    accountId: string
    appId: string
}

// =============================================================================
// Empty Device State
// =============================================================================

function EmptyDeviceState() {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                    No devices registered
                </h3>
                <p className="text-sm text-neutral-500 mb-4 max-w-md mx-auto">
                    Devices will appear here when they connect using keyless SDK
                    authentication. Enable keyless mode in your app by setting{' '}
                    <code className="bg-neutral-100 px-1 rounded">keyless: true</code> in
                    your BundleNudge config.
                </p>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Component
// =============================================================================

export function DevicesTab({ accountId, appId }: DevicesTabProps) {
    const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')
    const [offset, setOffset] = useState(0)

    const queryParams = {
        limit: 20,
        offset,
        platform: platformFilter !== 'all' ? platformFilter : undefined,
    }

    const { devices, pagination, isLoading, isError } = useDevices(
        accountId,
        appId,
        queryParams
    )

    function handlePageChange(newOffset: number) {
        setOffset(newOffset)
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <DevicesInfoCard />
                <DeviceTableSkeleton />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <DevicesInfoCard />
                <AudienceErrorState message="Failed to load devices" />
            </div>
        )
    }

    if (devices.length === 0) {
        return (
            <div className="space-y-6">
                <DevicesInfoCard />
                <EmptyDeviceState />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Info Card */}
            <DevicesInfoCard />

            {/* Filter */}
            <div className="flex items-center justify-end">
                <Select
                    value={platformFilter}
                    onValueChange={(value) => {
                        setPlatformFilter(value as PlatformFilter)
                        setOffset(0)
                    }}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Devices Table */}
            <DeviceTable
                devices={devices}
                appId={appId}
                accountId={accountId}
                pagination={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    )
}
