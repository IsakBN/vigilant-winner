'use client'

/**
 * DeviceTargetingCard Component
 *
 * Allows adding/removing devices from allowlist or blocklist.
 */

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// =============================================================================
// Types
// =============================================================================

interface DeviceTargetingCardProps {
    type: 'allowlist' | 'blocklist'
    devices: string[]
    onAdd: (deviceId: string) => void
    onRemove: (deviceId: string) => void
}

// =============================================================================
// Component
// =============================================================================

export function DeviceTargetingCard({
    type,
    devices,
    onAdd,
    onRemove,
}: DeviceTargetingCardProps) {
    const [newDeviceId, setNewDeviceId] = useState('')

    const isAllowlist = type === 'allowlist'
    const title = isAllowlist ? 'Device Allowlist' : 'Device Blocklist'
    const description = isAllowlist
        ? 'These devices will always receive the update, regardless of rollout percentage.'
        : 'These devices will never receive the update, regardless of rollout percentage.'
    const bgColor = isAllowlist ? 'bg-green-50' : 'bg-red-50'
    const borderColor = isAllowlist ? 'border-green-100' : 'border-red-100'
    const textColor = isAllowlist ? 'text-green-700' : 'text-red-700'
    const buttonColor = isAllowlist
        ? 'text-green-400 hover:text-green-600'
        : 'text-red-400 hover:text-red-600'

    const handleAdd = () => {
        if (!newDeviceId.trim()) return
        onAdd(newDeviceId.trim())
        setNewDeviceId('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd()
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-neutral-500">{description}</p>

                <div className="flex gap-2">
                    <Input
                        placeholder="Add device ID"
                        value={newDeviceId}
                        onChange={(e) => setNewDeviceId(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={handleAdd}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {devices.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {devices.map((id) => (
                            <div
                                key={id}
                                className={`flex items-center justify-between text-xs ${bgColor} border ${borderColor} rounded px-2 py-1`}
                            >
                                <code className={`${textColor} truncate`}>{id}</code>
                                <button
                                    type="button"
                                    onClick={() => onRemove(id)}
                                    className={`${buttonColor} ml-2 flex-shrink-0`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-400 text-center py-4">
                        No devices in {type}
                    </p>
                )}

                <p className="text-xs text-neutral-400">
                    {devices.length} device{devices.length === 1 ? '' : 's'}
                </p>
            </CardContent>
        </Card>
    )
}
