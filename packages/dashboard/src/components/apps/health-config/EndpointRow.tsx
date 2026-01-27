'use client'

/**
 * EndpointRow Component
 *
 * Row for editing a critical endpoint in the health config editor.
 */

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { HttpMethod } from '@/hooks/useHealthConfig'

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export interface LocalEndpoint {
    id: string
    method: HttpMethod
    url: string
    expectedStatusCodes: string
    required: boolean
}

interface EndpointRowProps {
    endpoint: LocalEndpoint
    onChange: (updated: LocalEndpoint) => void
    onDelete: () => void
}

export function EndpointRow({ endpoint, onChange, onDelete }: EndpointRowProps) {
    return (
        <div className="flex items-center gap-3 py-2">
            <input
                type="checkbox"
                checked={endpoint.required}
                onChange={(e) => onChange({ ...endpoint, required: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-300"
            />
            <Select
                value={endpoint.method}
                onValueChange={(value: HttpMethod) =>
                    onChange({ ...endpoint, method: value })
                }
            >
                <SelectTrigger className="w-24">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {HTTP_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                            {method}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                value={endpoint.url}
                onChange={(e) => onChange({ ...endpoint, url: e.target.value })}
                placeholder="/api/endpoint"
                className="flex-1"
            />
            <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-500 whitespace-nowrap">Expected:</span>
                <Input
                    value={endpoint.expectedStatusCodes}
                    onChange={(e) =>
                        onChange({ ...endpoint, expectedStatusCodes: e.target.value })
                    }
                    placeholder="200, 201"
                    className="w-24"
                />
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-neutral-500" />
            </Button>
        </div>
    )
}
