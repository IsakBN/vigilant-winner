'use client'

/**
 * DeviceCard Component
 *
 * Displays a device summary in a card format.
 */

import Link from 'next/link'
import { Smartphone, Monitor, Clock, Package, Ban } from 'lucide-react'
import { Card, CardContent, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Device } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface DeviceCardProps {
  device: Device
  appId: string
  accountId: string
}

// =============================================================================
// Helpers
// =============================================================================

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

function getPlatformColors(platform: string) {
  return platform === 'ios'
    ? { bg: 'bg-neutral-100', text: 'text-neutral-700' }
    : { bg: 'bg-green-100', text: 'text-green-700' }
}

function truncateId(id: string, length = 12): string {
  if (id.length <= length) return id
  return `${id.slice(0, length)}...`
}

// =============================================================================
// Component
// =============================================================================

export function DeviceCard({ device, appId, accountId }: DeviceCardProps) {
  const colors = getPlatformColors(device.platform)
  const deviceUrl = `/dashboard/${accountId}/apps/${appId}/devices/${device.id}`
  const isRevoked = Boolean(device.revokedAt)

  return (
    <Link href={deviceUrl} className="block group">
      <Card
        className={cn(
          'h-full transition-all hover:border-primary/50 hover:shadow-md',
          isRevoked && 'opacity-60'
        )}
      >
        <CardContent className="p-5">
          {/* Header: Icon and Status */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn('p-2.5 rounded-lg', colors.bg)}>
              {device.platform === 'ios' ? (
                <Smartphone className={cn('w-5 h-5', colors.text)} />
              ) : (
                <Monitor className={cn('w-5 h-5', colors.text)} />
              )}
            </div>
            <div className="flex items-center gap-2">
              {isRevoked ? (
                <Badge variant="destructive" className="text-xs">
                  <Ban className="w-3 h-3 mr-1" />
                  Revoked
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className={cn('text-xs capitalize', colors.bg, colors.text)}
                >
                  {device.platform}
                </Badge>
              )}
            </div>
          </div>

          {/* Device ID */}
          <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary transition-colors">
            {device.deviceModel || 'Unknown Device'}
          </h3>

          {/* Device ID (truncated) */}
          <p className="text-xs text-neutral-500 font-mono mb-4">
            {truncateId(device.deviceId)}
          </p>

          {/* Info Grid */}
          <div className="space-y-2 text-sm">
            {/* App Version */}
            <div className="flex items-center gap-2 text-neutral-600">
              <Package className="w-4 h-4 text-neutral-400" />
              <span>v{device.appVersion || 'Unknown'}</span>
            </div>

            {/* Last Seen */}
            <div className="flex items-center gap-2 text-neutral-600">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>{getRelativeTime(device.lastSeenAt)}</span>
            </div>
          </div>

          {/* Bundle Version Footer */}
          {device.currentBundleVersion && (
            <div className="mt-4 pt-3 border-t border-neutral-100">
              <p className="text-xs text-neutral-500">
                Bundle:{' '}
                <span className="font-mono text-neutral-700">
                  {device.currentBundleVersion}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
