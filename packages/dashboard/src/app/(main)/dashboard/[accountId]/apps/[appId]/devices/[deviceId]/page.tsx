'use client'

/**
 * Device Detail Page
 *
 * View device information, current release, and update history.
 */

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Smartphone, Ban } from 'lucide-react'
import { useDevice, useRevokeDevice } from '@/hooks/useDevices'
import { DeviceInfo, DeviceDetailSkeleton, UpdateHistory } from '@/components/devices'
import {
  Button,
  Badge,
  useToast,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui'

// =============================================================================
// Revoke Confirmation Dialog
// =============================================================================

interface RevokeDialogProps {
  onConfirm: () => void
  isPending: boolean
}

function RevokeDialog({ onConfirm, isPending }: RevokeDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Ban className="w-4 h-4 mr-2" />
          Revoke Access
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Device Access</AlertDialogTitle>
          <AlertDialogDescription>
            This will revoke the device&apos;s access token and prevent it from
            receiving updates. The device will need to re-register to receive
            updates again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Revoking...' : 'Revoke Access'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// =============================================================================
// Page Component
// =============================================================================

export default function DeviceDetailPage() {
  const params = useParams()
  const { toast } = useToast()

  const appId = params.appId as string
  const accountId = params.accountId as string
  const deviceId = params.deviceId as string

  const { data, isLoading, error } = useDevice(appId, deviceId)
  const revokeMutation = useRevokeDevice(appId)

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync(deviceId)
      toast({ title: 'Device access revoked successfully' })
    } catch (err) {
      toast({
        title: 'Failed to revoke device',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    }
  }

  if (isLoading) {
    return <DeviceDetailSkeleton />
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">
          {error?.message ?? 'Device not found'}
        </p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${accountId}/apps/${appId}/devices`}>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${accountId}/apps/${appId}/devices`}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </Link>
          <div className="p-2.5 bg-neutral-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900">
                {device.deviceModel || 'Unknown Device'}
              </h1>
              {isRevoked && <Badge variant="destructive">Revoked</Badge>}
            </div>
            <p className="text-sm text-neutral-500 font-mono">
              {device.deviceId.slice(0, 24)}...
            </p>
          </div>
        </div>

        {!isRevoked && (
          <RevokeDialog
            onConfirm={handleRevoke}
            isPending={revokeMutation.isPending}
          />
        )}
      </div>

      {/* Device Info */}
      <DeviceInfo device={device} />

      {/* Update History */}
      <UpdateHistory events={updateHistory} />
    </div>
  )
}
