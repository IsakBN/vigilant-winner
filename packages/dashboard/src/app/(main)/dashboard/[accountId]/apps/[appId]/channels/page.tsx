'use client'

/**
 * Channels List Page
 *
 * Displays all channels for an app with the ability to create new ones.
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Radio } from 'lucide-react'
import { useChannels, useCreateChannel } from '@/hooks/useChannels'
import { ChannelList } from '@/components/channels'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Textarea,
  useToast,
} from '@/components/ui'
import type { CreateChannelInput } from '@/lib/api'

// =============================================================================
// Create Channel Dialog
// =============================================================================

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appId: string
  onSuccess: () => void
}

function CreateChannelDialog({
  open,
  onOpenChange,
  appId,
  onSuccess,
}: CreateChannelDialogProps) {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useCreateChannel(appId)
  const { toast } = useToast()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setName(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !displayName) {
      toast({ title: 'Please fill in all required fields', variant: 'error' })
      return
    }

    try {
      const data: CreateChannelInput = {
        name,
        displayName,
        description: description || undefined,
      }

      await createMutation.mutateAsync(data)
      toast({ title: 'Channel created successfully' })
      onSuccess()
      resetForm()
    } catch (err) {
      toast({
        title: 'Failed to create channel',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    }
  }

  const resetForm = () => {
    setName('')
    setDisplayName('')
    setDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new release channel for your app.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Beta Testers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Channel ID *</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., beta-testers"
              className="font-mono"
              required
            />
            <p className="text-xs text-neutral-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this channel"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Page Header
// =============================================================================

interface PageHeaderProps {
  onCreateClick: () => void
}

function PageHeader({ onCreateClick }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-neutral-100 rounded-lg">
          <Radio className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Channels</h1>
          <p className="text-sm text-neutral-500">
            Manage release channels for different environments
          </p>
        </div>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="w-4 h-4 mr-2" />
        Create Channel
      </Button>
    </div>
  )
}

// =============================================================================
// Page Component
// =============================================================================

export default function ChannelsPage() {
  const params = useParams()
  const appId = params.appId as string
  const accountId = params.accountId as string

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { channels, isLoading, refetch } = useChannels(appId)

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    void refetch()
  }

  return (
    <div>
      <PageHeader onCreateClick={() => setCreateDialogOpen(true)} />

      <ChannelList
        channels={channels}
        appId={appId}
        accountId={accountId}
        isLoading={isLoading}
        onCreateClick={() => setCreateDialogOpen(true)}
      />

      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        appId={appId}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
