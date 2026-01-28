'use client'

/**
 * AppSettingsForm Component
 *
 * Form for editing app name. Bundle ID is read-only.
 */

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Label,
} from '@bundlenudge/shared-ui'

interface AppSettingsFormProps {
    currentName: string
    currentBundleId: string | null
    isSaving: boolean
    onSave: (data: { name: string }) => Promise<void>
}

export function AppSettingsForm({
    currentName,
    currentBundleId,
    isSaving,
    onSave,
}: AppSettingsFormProps) {
    const [name, setName] = useState(currentName)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setName(currentName)
    }, [currentName])

    const hasChanges = name !== currentName

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const trimmedName = name.trim()
        if (!trimmedName) {
            setError('App name is required')
            return
        }
        if (trimmedName.length < 2) {
            setError('App name must be at least 2 characters')
            return
        }

        await onSave({ name: trimmedName })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                    Basic configuration for your app.
                </CardDescription>
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
                            value={currentBundleId ?? ''}
                            disabled
                            className="font-mono text-sm bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            The bundle ID cannot be changed after app creation.
                        </p>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" disabled={isSaving || !hasChanges}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
