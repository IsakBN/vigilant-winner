'use client'

/**
 * TeamSettingsForm Component
 *
 * Form for editing team name and displaying slug.
 */

import { useState, useCallback } from 'react'
import {
    Button,
    Input,
    Label,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'

interface TeamSettingsFormProps {
    team: {
        name: string
        slug: string
    }
    onUpdate: (data: { name: string }) => Promise<void>
    isUpdating: boolean
}

export function TeamSettingsForm({
    team,
    onUpdate,
    isUpdating,
}: TeamSettingsFormProps) {
    const [name, setName] = useState(team.name)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const hasChanges = name.trim() !== team.name
    const isValid = name.trim().length > 0

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!hasChanges || !isValid) return

            setError(null)
            setSuccess(false)

            try {
                await onUpdate({ name: name.trim() })
                setSuccess(true)
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(false), 3000)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to save settings')
            }
        },
        [name, hasChanges, isValid, onUpdate]
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>
                    Update your team&apos;s basic information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="team-name">Team Name</Label>
                        <Input
                            id="team-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isUpdating}
                            placeholder="My Team"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="team-slug">Team Slug</Label>
                        <Input
                            id="team-slug"
                            value={team.slug}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            The team slug cannot be changed after creation.
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {success && (
                        <p className="text-sm text-green-600">Settings saved successfully.</p>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={!hasChanges || !isValid || isUpdating}
                        >
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
