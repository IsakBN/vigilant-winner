'use client'

/**
 * GeneralSettingsSection Component
 *
 * Handles app name and bundle ID settings.
 */

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// =============================================================================
// Types
// =============================================================================

interface GeneralSettingsSectionProps {
    currentName: string
    currentBundleId: string | null
    isLoading: boolean
    isSaving: boolean
    onSave: (data: { name?: string; bundleId?: string }) => Promise<void>
}

// =============================================================================
// Component
// =============================================================================

export function GeneralSettingsSection({
    currentName,
    currentBundleId,
    isLoading,
    isSaving,
    onSave,
}: GeneralSettingsSectionProps) {
    const [name, setName] = useState(currentName)
    const [bundleId, setBundleId] = useState(currentBundleId ?? '')
    const [error, setError] = useState<string | null>(null)

    // Sync with props when they change
    useEffect(() => {
        setName(currentName)
        setBundleId(currentBundleId ?? '')
    }, [currentName, currentBundleId])

    const hasChanges = name !== currentName || bundleId !== (currentBundleId ?? '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('App name is required')
            return
        }
        if (name.length < 2) {
            setError('App name must be at least 2 characters')
            return
        }
        setError(null)

        const updates: { name?: string; bundleId?: string } = {}
        if (name !== currentName) updates.name = name.trim()
        if (bundleId !== (currentBundleId ?? '')) updates.bundleId = bundleId.trim()

        await onSave(updates)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <p className="text-sm text-neutral-500 mt-1">
                    Basic configuration for your app.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="app-name">App Name</Label>
                        <Input
                            id="app-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My App"
                            disabled={isSaving}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bundle-id">Bundle ID</Label>
                        <Input
                            id="bundle-id"
                            value={bundleId}
                            onChange={(e) => setBundleId(e.target.value)}
                            placeholder="com.example.myapp"
                            disabled={isSaving}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-neutral-500">
                            The unique identifier for your app (e.g., com.example.myapp)
                        </p>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <Button type="submit" disabled={isSaving || !hasChanges}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
