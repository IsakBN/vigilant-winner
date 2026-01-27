'use client'

/**
 * EventRow Component
 *
 * Row for editing a critical event in the health config editor.
 */

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface LocalEvent {
    id: string
    name: string
    required: boolean
    timeoutSeconds: number
}

interface EventRowProps {
    event: LocalEvent
    onChange: (updated: LocalEvent) => void
    onDelete: () => void
}

export function EventRow({ event, onChange, onDelete }: EventRowProps) {
    return (
        <div className="flex items-center gap-3 py-2">
            <input
                type="checkbox"
                checked={event.required}
                onChange={(e) => onChange({ ...event, required: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-300"
            />
            <Input
                value={event.name}
                onChange={(e) => onChange({ ...event, name: e.target.value })}
                placeholder="onEventName"
                className="flex-1"
            />
            <span className="text-sm text-neutral-500 whitespace-nowrap">
                {event.required ? 'Required' : 'Optional'}
            </span>
            <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-500">Timeout:</span>
                <Input
                    type="number"
                    value={event.timeoutSeconds}
                    onChange={(e) =>
                        onChange({ ...event, timeoutSeconds: parseInt(e.target.value) || 30 })
                    }
                    className="w-16"
                    min={1}
                    max={300}
                />
                <span className="text-sm text-neutral-500">s</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-neutral-500" />
            </Button>
        </div>
    )
}
