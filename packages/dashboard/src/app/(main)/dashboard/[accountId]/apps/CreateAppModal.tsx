'use client'

/**
 * CreateAppModal Component
 *
 * Modal dialog for creating a new app.
 */

import { useState, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Input,
    Label,
} from '@/components/ui'
import { PlatformFilter } from '@/components/apps'
import { useCreateApp } from '@/hooks/useApps'
import type { Platform } from '@/lib/api'

interface CreateAppModalProps {
    accountId: string
    open: boolean
    onClose: () => void
}

export function CreateAppModal({ accountId, open, onClose }: CreateAppModalProps) {
    const [name, setName] = useState('')
    const [platform, setPlatform] = useState<Platform>('ios')
    const [bundleId, setBundleId] = useState('')

    const createApp = useCreateApp(accountId)

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()

            if (!name.trim()) return

            try {
                await createApp.mutateAsync({
                    name: name.trim(),
                    platform,
                    bundleId: bundleId.trim() || undefined,
                })

                // Reset form and close modal on success
                setName('')
                setPlatform('ios')
                setBundleId('')
                onClose()
            } catch {
                // Error is handled by the mutation state
            }
        },
        [name, platform, bundleId, createApp, onClose]
    )

    const handleClose = useCallback(() => {
        if (!createApp.isPending) {
            setName('')
            setPlatform('ios')
            setBundleId('')
            onClose()
        }
    }, [createApp.isPending, onClose])

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New App</DialogTitle>
                    <DialogDescription>
                        Add a new React Native app to push OTA updates.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* App Name */}
                    <div className="space-y-2">
                        <Label htmlFor="app-name">App Name</Label>
                        <Input
                            id="app-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome App"
                            required
                            disabled={createApp.isPending}
                        />
                    </div>

                    {/* Platform */}
                    <div className="space-y-2">
                        <Label>Platform</Label>
                        <div>
                            <PlatformFilter
                                value={platform}
                                onChange={(p) => {
                                    if (p !== 'all') setPlatform(p)
                                }}
                                disabled={createApp.isPending}
                            />
                        </div>
                    </div>

                    {/* Bundle ID */}
                    <div className="space-y-2">
                        <Label htmlFor="bundle-id">Bundle ID (optional)</Label>
                        <Input
                            id="bundle-id"
                            value={bundleId}
                            onChange={(e) => setBundleId(e.target.value)}
                            placeholder="com.example.myapp"
                            disabled={createApp.isPending}
                        />
                        <p className="text-xs text-text-light">
                            The bundle identifier for your app (e.g., com.company.app)
                        </p>
                    </div>

                    {/* Error Message */}
                    {createApp.isError && (
                        <p className="text-sm text-destructive">
                            {createApp.error?.message ?? 'Failed to create app'}
                        </p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createApp.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createApp.isPending || !name.trim()}>
                            {createApp.isPending ? 'Creating...' : 'Create App'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
