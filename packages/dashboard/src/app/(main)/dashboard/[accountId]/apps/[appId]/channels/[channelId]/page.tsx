'use client'

/**
 * Channel Detail Page
 *
 * View and edit channel settings, rollout control, and targeting rules.
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Radio, Save, Trash2 } from 'lucide-react'
import { useChannel, useUpdateChannel, useDeleteChannel } from '@/hooks/useChannels'
import { RolloutSlider, TargetingRules } from '@/components/channels'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Switch,
  Skeleton,
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
import type { ChannelTargetingRules, UpdateChannelInput } from '@/lib/api'

// =============================================================================
// Loading State
// =============================================================================

function ChannelDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Delete Confirmation
// =============================================================================

interface DeleteConfirmProps {
  channelName: string
  onConfirm: () => void
  isPending: boolean
}

function DeleteConfirmDialog({ channelName, onConfirm, isPending }: DeleteConfirmProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Channel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the channel &quot;{channelName}&quot;?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// =============================================================================
// Page Component
// =============================================================================

export default function ChannelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const appId = params.appId as string
  const accountId = params.accountId as string
  const channelId = params.channelId as string

  const { data: channel, isLoading, error } = useChannel(appId, channelId)
  const updateMutation = useUpdateChannel(appId, channelId)
  const deleteMutation = useDeleteChannel(appId)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [rolloutPercentage, setRolloutPercentage] = useState(100)
  const [targetingRules, setTargetingRules] = useState<ChannelTargetingRules | null>(null)

  // Sync form state with fetched channel
  useEffect(() => {
    if (channel) {
      setDisplayName(channel.displayName)
      setDescription(channel.description ?? '')
      setIsDefault(channel.isDefault)
      setRolloutPercentage(channel.rolloutPercentage)
      setTargetingRules(channel.targetingRules)
    }
  }, [channel])

  const handleSave = async () => {
    try {
      const data: UpdateChannelInput = {
        displayName,
        description: description || null,
        isDefault,
        rolloutPercentage,
        targetingRules,
      }

      await updateMutation.mutateAsync(data)
      toast({ title: 'Channel updated successfully' })
    } catch (err) {
      toast({
        title: 'Failed to update channel',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(channelId)
      toast({ title: 'Channel deleted successfully' })
      router.push(`/dashboard/${accountId}/apps/${appId}/channels`)
    } catch (err) {
      toast({
        title: 'Failed to delete channel',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    }
  }

  if (isLoading) {
    return <ChannelDetailSkeleton />
  }

  if (error || !channel) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">
          {error?.message ?? 'Channel not found'}
        </p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${accountId}/apps/${appId}/channels`}>
            Back to Channels
          </Link>
        </Button>
      </div>
    )
  }

  const isDefaultChannel = ['production', 'staging', 'development'].includes(channel.name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${accountId}/apps/${appId}/channels`}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </Link>
          <div className="p-2.5 bg-neutral-100 rounded-lg">
            <Radio className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900">
                {channel.displayName}
              </h1>
              {channel.isDefault && (
                <Badge variant="secondary">Default</Badge>
              )}
            </div>
            <p className="text-sm text-neutral-500 font-mono">{channel.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isDefaultChannel && (
            <DeleteConfirmDialog
              channelName={channel.displayName}
              onConfirm={handleDelete}
              isPending={deleteMutation.isPending}
            />
          )}
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channel Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Channel display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelId">Channel ID</Label>
              <Input
                id="channelId"
                value={channel.name}
                disabled
                className="font-mono bg-neutral-50"
              />
              {isDefaultChannel && (
                <p className="text-xs text-neutral-500">
                  Default channels cannot be renamed
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <Label>Default Channel</Label>
              <p className="text-sm text-neutral-500">
                Make this the default channel for new devices
              </p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </CardContent>
      </Card>

      {/* Rollout Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rollout Control</CardTitle>
        </CardHeader>
        <CardContent>
          <RolloutSlider
            value={rolloutPercentage}
            onChange={setRolloutPercentage}
          />
        </CardContent>
      </Card>

      {/* Targeting Rules */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900 mb-3">
          Targeting Rules
        </h2>
        <TargetingRules value={targetingRules} onChange={setTargetingRules} />
      </div>
    </div>
  )
}
