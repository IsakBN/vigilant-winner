'use client'

/**
 * RegisteredDevicesCard Component
 *
 * Displays a list of registered test devices.
 */

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'
import type { TestDevice } from './TestRolloutDialog'

// =============================================================================
// Types
// =============================================================================

interface RegisteredDevicesCardProps {
    devices: TestDevice[]
}

// =============================================================================
// Component
// =============================================================================

export function RegisteredDevicesCard({ devices }: RegisteredDevicesCardProps) {
    if (devices.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Registered Test Devices ({devices.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {devices.map((device) => (
                        <div
                            key={device.deviceId}
                            className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                        >
                            <div>
                                <p className="font-medium text-sm">{device.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                    {device.deviceId.slice(0, 24)}...
                                </p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-neutral-100 rounded capitalize">
                                {device.platform}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
