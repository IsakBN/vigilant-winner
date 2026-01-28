'use client'

/**
 * CreateChannelDialog Component
 *
 * Modal dialog for creating a new channel.
 */

import { useState } from 'react'
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
} from '@bundlenudge/shared-ui'
import { useCreateChannel, type CreateChannelInput } from '@/hooks'

// =============================================================================
// Types
// =============================================================================

interface CreateChannelDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    accountId: string
    appId: string
    onSuccess: () => void
}

// =============================================================================
// Component
// =============================================================================

export function CreateChannelDialog({
    open,
    onOpenChange,
    accountId,
    appId,
    onSuccess,
}: CreateChannelDialogProps) {
    const [name, setName] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState<string | null>(null)

    const createMutation = useCreateChannel(accountId, appId)

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
        setName(value)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name || !displayName) {
            setError('Please fill in all required fields')
            return
        }

        const data: CreateChannelInput = {
            name,
            displayName,
            description: description || undefined,
        }

        createMutation.mutate(data, {
            onSuccess: () => {
                onSuccess()
                resetForm()
            },
            onError: (err) => {
                setError(err instanceof Error ? err.message : 'Failed to create channel')
            },
        })
    }

    const resetForm = () => {
        setName('')
        setDisplayName('')
        setDescription('')
        setError(null)
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
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

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
                        <p className="text-xs text-text-light">
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
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-bright-accent text-white hover:opacity-90"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Channel'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
