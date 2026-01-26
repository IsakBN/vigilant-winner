'use client'

/**
 * WebhookForm Component
 *
 * Form for creating and editing webhooks.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { WEBHOOK_EVENTS, type WebhookEvent, type Webhook } from '@/lib/api'

interface WebhookFormProps {
    webhook?: Webhook
    isLoading: boolean
    onSubmit: (data: WebhookFormData) => void
    onCancel: () => void
}

export interface WebhookFormData {
    name: string
    url: string
    events: WebhookEvent[]
    enabled: boolean
}

export function WebhookForm({
    webhook,
    isLoading,
    onSubmit,
    onCancel,
}: WebhookFormProps) {
    const [name, setName] = useState(webhook?.name ?? '')
    const [url, setUrl] = useState(webhook?.url ?? '')
    const [events, setEvents] = useState<WebhookEvent[]>(
        webhook?.events ?? []
    )
    const [enabled, setEnabled] = useState(webhook?.enabled ?? true)
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!name.trim()) {
            setError('Name is required')
            return
        }

        if (!url.trim()) {
            setError('URL is required')
            return
        }

        try {
            new URL(url)
        } catch {
            setError('Invalid URL format')
            return
        }

        if (events.length === 0) {
            setError('Select at least one event')
            return
        }

        onSubmit({ name, url, events, enabled })
    }

    const toggleEvent = (event: WebhookEvent) => {
        setEvents((prev) =>
            prev.includes(event)
                ? prev.filter((e) => e !== event)
                : [...prev, event]
        )
    }

    const selectAllEvents = () => {
        setEvents(WEBHOOK_EVENTS.map((e) => e.value))
    }

    const clearAllEvents = () => {
        setEvents([])
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {webhook ? 'Edit Webhook' : 'Create Webhook'}
                </CardTitle>
                <CardDescription>
                    {webhook
                        ? 'Update your webhook configuration'
                        : 'Configure a new webhook endpoint'}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Webhook"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="url">Endpoint URL</Label>
                        <Input
                            id="url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/webhook"
                            className="mt-1"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="enabled">Enabled</Label>
                        <Switch
                            id="enabled"
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <Label>Events</Label>
                            <div className="space-x-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={selectAllEvents}
                                >
                                    Select All
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAllEvents}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {WEBHOOK_EVENTS.map((event) => (
                                <label
                                    key={event.value}
                                    className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted"
                                >
                                    <input
                                        type="checkbox"
                                        checked={events.includes(event.value)}
                                        onChange={() =>
                                            toggleEvent(event.value)
                                        }
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm">
                                        {event.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading
                            ? 'Saving...'
                            : webhook
                              ? 'Update'
                              : 'Create'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
