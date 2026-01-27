'use client'

/**
 * HealthConfigEditor Component
 *
 * Postman-style UI for configuring critical events and endpoints
 * for app health checks.
 */

import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { EventRow, type LocalEvent } from './health-config/EventRow'
import { EndpointRow, type LocalEndpoint } from './health-config/EndpointRow'
import type {
    HealthConfig,
    CriticalEvent,
    CriticalEndpoint,
    SaveHealthConfigInput,
} from '@/hooks/useHealthConfig'

// =============================================================================
// Types
// =============================================================================

interface HealthConfigEditorProps {
    config?: HealthConfig
    isLoading: boolean
    isSaving: boolean
    onSave: (config: SaveHealthConfigInput) => Promise<unknown>
}

// =============================================================================
// Helpers
// =============================================================================

function generateId(): string {
    return Math.random().toString(36).substring(2, 11)
}

function convertToLocalEvents(events: CriticalEvent[]): LocalEvent[] {
    return events.map((e) => ({ ...e }))
}

function convertToLocalEndpoints(endpoints: CriticalEndpoint[]): LocalEndpoint[] {
    return endpoints.map((e) => ({
        ...e,
        expectedStatusCodes: e.expectedStatusCodes.join(', '),
    }))
}

// =============================================================================
// Main Component
// =============================================================================

export function HealthConfigEditor({
    config,
    isLoading,
    isSaving,
    onSave,
}: HealthConfigEditorProps) {
    const [events, setEvents] = useState<LocalEvent[]>(() =>
        config?.criticalEvents ? convertToLocalEvents(config.criticalEvents) : []
    )
    const [endpoints, setEndpoints] = useState<LocalEndpoint[]>(() =>
        config?.criticalEndpoints ? convertToLocalEndpoints(config.criticalEndpoints) : []
    )
    const [error, setError] = useState<string | null>(null)

    const addEvent = useCallback(() => {
        setEvents((prev) => [
            ...prev,
            { id: generateId(), name: '', required: true, timeoutSeconds: 30 },
        ])
    }, [])

    const updateEvent = useCallback((id: string, updated: LocalEvent) => {
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
    }, [])

    const deleteEvent = useCallback((id: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== id))
    }, [])

    const addEndpoint = useCallback(() => {
        setEndpoints((prev) => [
            ...prev,
            {
                id: generateId(),
                method: 'GET',
                url: '',
                expectedStatusCodes: '200',
                required: true,
            },
        ])
    }, [])

    const updateEndpoint = useCallback((id: string, updated: LocalEndpoint) => {
        setEndpoints((prev) => prev.map((e) => (e.id === id ? updated : e)))
    }, [])

    const deleteEndpoint = useCallback((id: string) => {
        setEndpoints((prev) => prev.filter((e) => e.id !== id))
    }, [])

    const handleSave = async () => {
        setError(null)

        for (const event of events) {
            if (!event.name.trim()) {
                setError('All events must have a name')
                return
            }
        }

        for (const endpoint of endpoints) {
            if (!endpoint.url.trim()) {
                setError('All endpoints must have a URL')
                return
            }
        }

        const saveData: SaveHealthConfigInput = {
            criticalEvents: events.map(({ name, required, timeoutSeconds }) => ({
                name,
                required,
                timeoutSeconds,
            })),
            criticalEndpoints: endpoints.map(({ method, url, expectedStatusCodes, required }) => ({
                method,
                url,
                required,
                expectedStatusCodes: expectedStatusCodes
                    .split(',')
                    .map((s) => parseInt(s.trim()))
                    .filter((n) => !isNaN(n)),
            })),
        }

        try {
            await onSave(saveData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save configuration')
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Health Check Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-neutral-200 rounded" />
                        <div className="h-8 bg-neutral-200 rounded" />
                        <div className="h-8 bg-neutral-200 rounded" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Health Check Configuration</CardTitle>
                <CardDescription>
                    Configure critical events and endpoints to monitor app health after updates.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Critical Events Section */}
                <div>
                    <Label className="text-base font-medium">Critical Events</Label>
                    <p className="text-sm text-neutral-500 mb-3">
                        Events that must fire within the timeout after app start.
                    </p>
                    <div className="space-y-1 border rounded-lg p-3">
                        {events.length === 0 ? (
                            <p className="text-sm text-neutral-400 py-2">No events configured</p>
                        ) : (
                            events.map((event) => (
                                <EventRow
                                    key={event.id}
                                    event={event}
                                    onChange={(updated) => updateEvent(event.id, updated)}
                                    onDelete={() => deleteEvent(event.id)}
                                />
                            ))
                        )}
                        <Button variant="outline" size="sm" onClick={addEvent} className="mt-2">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Event
                        </Button>
                    </div>
                </div>

                {/* Critical Endpoints Section */}
                <div>
                    <Label className="text-base font-medium">Critical Endpoints</Label>
                    <p className="text-sm text-neutral-500 mb-3">
                        Endpoints checked after the app reports ready.
                    </p>
                    <div className="space-y-1 border rounded-lg p-3">
                        {endpoints.length === 0 ? (
                            <p className="text-sm text-neutral-400 py-2">No endpoints configured</p>
                        ) : (
                            endpoints.map((endpoint) => (
                                <EndpointRow
                                    key={endpoint.id}
                                    endpoint={endpoint}
                                    onChange={(updated) => updateEndpoint(endpoint.id, updated)}
                                    onDelete={() => deleteEndpoint(endpoint.id)}
                                />
                            ))
                        )}
                        <Button variant="outline" size="sm" onClick={addEndpoint} className="mt-2">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Endpoint
                        </Button>
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </CardFooter>
        </Card>
    )
}
