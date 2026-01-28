'use client'

/**
 * DeviceHeader Component
 *
 * Header section for device detail page with device info and actions.
 */

import Link from 'next/link'
import { ArrowLeft, Smartphone } from 'lucide-react'
import { Badge } from '@bundlenudge/shared-ui'
import { PlatformBadge } from '@/components/apps/PlatformBadge'
import type { DeviceWithRelease } from '@/lib/api'

interface DeviceHeaderProps {
    device: DeviceWithRelease
    basePath: string
    actions?: React.ReactNode
}

export function DeviceHeader({ device, basePath, actions }: DeviceHeaderProps) {
    const isRevoked = Boolean(device.revokedAt)
    const displayId = device.deviceId.length > 24
        ? `${device.deviceId.slice(0, 24)}...`
        : device.deviceId

    return (
        <div className="flex items-start justify-between">
            <div>
                <Link
                    href={`${basePath}/devices`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Devices
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-lg">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-foreground">
                                {device.deviceModel || 'Unknown Device'}
                            </h1>
                            <PlatformBadge platform={device.platform} />
                            {isRevoked && (
                                <Badge variant="destructive">Revoked</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono mt-0.5">
                            {displayId}
                        </p>
                    </div>
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    )
}
