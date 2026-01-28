'use client'

/**
 * Device Detail Page
 *
 * View device information, current release, and update history.
 */

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@bundlenudge/shared-ui'
import { useDevice, useRevokeDevice } from '@/hooks'
import {
    DeviceHeader,
    DeviceInfoCard,
    UpdateHistory,
    DeviceDetailSkeleton,
    RevokeDeviceDialog,
} from '@/components/devices'
import { ErrorState } from '@/components/shared/ErrorState'

export default function DeviceDetailPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const appId = params.appId as string
    const deviceId = params.deviceId as string

    const { data, isLoading, error, refetch } = useDevice(
        accountId,
        appId,
        deviceId,
        { refetchInterval: 30000 }
    )

    const revokeMutation = useRevokeDevice(accountId, appId)

    const basePath = `/dashboard/${accountId}/apps/${appId}`

    const handleRevoke = async () => {
        await revokeMutation.mutateAsync(deviceId)
    }

    if (isLoading) {
        return <DeviceDetailSkeleton />
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to load device"
                message={error instanceof Error ? error.message : 'Unknown error occurred'}
                onRetry={() => refetch()}
            />
        )
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Device not found</p>
                <Button variant="outline" asChild>
                    <Link href={`${basePath}/devices`}>
                        Back to Devices
                    </Link>
                </Button>
            </div>
        )
    }

    const { device, updateHistory } = data
    const isRevoked = Boolean(device.revokedAt)

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <DeviceHeader
                device={device}
                basePath={basePath}
                actions={
                    !isRevoked && (
                        <RevokeDeviceDialog
                            onConfirm={handleRevoke}
                            isPending={revokeMutation.isPending}
                        />
                    )
                }
            />

            {/* Device Info */}
            <DeviceInfoCard device={device} />

            {/* Update History */}
            <UpdateHistory events={updateHistory} />

            {/* Revoke Error */}
            {revokeMutation.error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {revokeMutation.error instanceof Error
                        ? revokeMutation.error.message
                        : 'Failed to revoke device'}
                </div>
            )}
        </div>
    )
}
