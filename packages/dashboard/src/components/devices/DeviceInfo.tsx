'use client'

/**
 * DeviceInfo Component
 *
 * Displays detailed device information in a structured layout.
 */

import { Smartphone, Monitor, Clock, Globe, MapPin, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { DeviceWithRelease } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface DeviceInfoProps {
  device: DeviceWithRelease
}

// =============================================================================
// Helpers
// =============================================================================

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
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function getPlatformIcon(platform: string) {
  return platform === 'ios' ? (
    <Smartphone className="w-4 h-4" />
  ) : (
    <Monitor className="w-4 h-4" />
  )
}

function getPlatformBadgeClass(platform: string): string {
  return platform === 'ios'
    ? 'bg-neutral-100 text-neutral-800'
    : 'bg-green-100 text-green-800'
}

// =============================================================================
// Info Item Component
// =============================================================================

interface InfoItemProps {
  label: string
  value: string | React.ReactNode
  icon?: React.ReactNode
}

function InfoItem({ label, value, icon }: InfoItemProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-neutral-900">{value || '-'}</p>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function DeviceInfo({ device }: DeviceInfoProps) {
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
              label="Platform"
              value={
                <Badge
                  variant="secondary"
                  className={cn('capitalize', getPlatformBadgeClass(device.platform))}
                >
                  {getPlatformIcon(device.platform)}
                  <span className="ml-1">{device.platform}</span>
                </Badge>
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
              <div className="p-3 bg-neutral-100 rounded-lg">
                <Package className="w-6 h-6 text-neutral-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">
                  v{device.currentRelease.version}
                </p>
                <p className="text-sm text-neutral-500">
                  Channel: {device.currentRelease.channelName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamps Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-500">Registered</span>
              <span className="text-sm font-medium">
                {formatTimestamp(device.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-500">Last Activity</span>
              <span className="text-sm font-medium">
                {formatTimestamp(device.lastSeenAt)}
              </span>
            </div>
            {isRevoked && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-red-500">Revoked</span>
                <span className="text-sm font-medium text-red-600">
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
