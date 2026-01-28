'use client'

/**
 * DeviceInfoCard Component
 *
 * Displays detailed device information in a structured card layout.
 */

import {
    Monitor,
    Clock,
    Globe,
    MapPin,
    Package,
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
} from '@bundlenudge/shared-ui'
import type { DeviceWithRelease } from '@/lib/api'

interface DeviceInfoCardProps {
    device: DeviceWithRelease
}

function formatTimestamp(timestamp: number | null): string {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getRelativeTime(timestamp: number | null): string {
    if (!timestamp) return 'Never'
    const now = Date.now()
    const diff = now - timestamp * 1000
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${String(minutes)}m ago`
    if (hours < 24) return `${String(hours)}h ago`
    return `${String(days)}d ago`
}

interface InfoItemProps {
    label: string
    value: string | React.ReactNode
    icon?: React.ReactNode
}

function InfoItem({ label, value, icon }: InfoItemProps) {
    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {icon}
                {label}
            </p>
            <p className="text-sm font-medium text-foreground">{value || '-'}</p>
        </div>
    )
}

export function DeviceInfoCard({ device }: DeviceInfoCardProps) {
    const isRevoked = Boolean(device.revokedAt)

    return (
        <div className="space-y-6">
            {/* Device Details Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Device Information</CardTitle>
                        {isRevoked && (
                            <Badge variant="destructive">Revoked</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <InfoItem
                            label="Device ID"
                            value={
                                <span className="font-mono text-xs break-all">
                                    {device.deviceId}
                                </span>
                            }
                        />
                        <InfoItem
                            label="Model"
                            value={device.deviceModel || 'Unknown'}
                        />
                        <InfoItem
                            label="OS Version"
                            icon={<Monitor className="w-3 h-3" />}
                            value={device.osVersion || 'Unknown'}
                        />
                        <InfoItem
                            label="App Version"
                            icon={<Package className="w-3 h-3" />}
                            value={device.appVersion || 'Unknown'}
                        />
                        <InfoItem
                            label="Bundle Version"
                            value={device.currentBundleVersion || 'None'}
                        />
                        <InfoItem
                            label="Timezone"
                            icon={<Globe className="w-3 h-3" />}
                            value={device.timezone || 'Unknown'}
                        />
                        <InfoItem
                            label="Locale"
                            icon={<MapPin className="w-3 h-3" />}
                            value={device.locale || 'Unknown'}
                        />
                        <InfoItem
                            label="Last Seen"
                            icon={<Clock className="w-3 h-3" />}
                            value={
                                <span title={formatTimestamp(device.lastSeenAt)}>
                                    {getRelativeTime(device.lastSeenAt)}
                                </span>
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Current Release Card */}
            {device.currentRelease && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Current Release</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">
                                    v{device.currentRelease.version}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Channel: {device.currentRelease.channelName}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Timeline Card */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Registered</span>
                            <span className="text-sm font-medium">
                                {formatTimestamp(device.createdAt)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Last Activity</span>
                            <span className="text-sm font-medium">
                                {formatTimestamp(device.lastSeenAt)}
                            </span>
                        </div>
                        {isRevoked && (
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-destructive">Revoked</span>
                                <span className="text-sm font-medium text-destructive">
                                    {formatTimestamp(device.revokedAt)}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
