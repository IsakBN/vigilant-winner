'use client'

/**
 * TestDeviceForm Component
 *
 * Form to register a test device for testing OTA updates.
 */

import { useState, useCallback } from 'react'
import { Smartphone, Plus, Copy, Check } from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

interface TestDevice {
    deviceId: string
    name: string
    platform: 'ios' | 'android'
    registeredAt: number
}

interface TestDeviceFormProps {
    appId: string
    onDeviceRegistered?: (device: TestDevice) => void
}

// =============================================================================
// Component
// =============================================================================

export function TestDeviceForm({ appId: _appId, onDeviceRegistered }: TestDeviceFormProps) {
    const [deviceId, setDeviceId] = useState('')
    const [deviceName, setDeviceName] = useState('')
    const [platform, setPlatform] = useState<'ios' | 'android'>('ios')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [registeredDevice, setRegisteredDevice] = useState<TestDevice | null>(null)
    const [copied, setCopied] = useState(false)

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            if (!deviceId.trim()) return

            setIsSubmitting(true)

            try {
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 500))

                const device: TestDevice = {
                    deviceId: deviceId.trim(),
                    name: deviceName.trim() || `Test Device ${Date.now()}`,
                    platform,
                    registeredAt: Date.now(),
                }

                setRegisteredDevice(device)
                onDeviceRegistered?.(device)

                // Reset form
                setDeviceId('')
                setDeviceName('')
            } finally {
                setIsSubmitting(false)
            }
        },
        [deviceId, deviceName, platform, onDeviceRegistered]
    )

    const handleCopyId = useCallback(async () => {
        if (registeredDevice) {
            await navigator.clipboard.writeText(registeredDevice.deviceId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [registeredDevice])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Smartphone className="w-4 h-4 text-neutral-500" />
                    Register Test Device
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="deviceId">Device ID</Label>
                        <Input
                            id="deviceId"
                            placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                            className="font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            The unique identifier from your device. Find this in the SDK logs.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deviceName">Device Name (optional)</Label>
                        <Input
                            id="deviceName"
                            placeholder="e.g., John's iPhone"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="platform">Platform</Label>
                        <Select
                            value={platform}
                            onValueChange={(value: 'ios' | 'android') => setPlatform(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ios">iOS</SelectItem>
                                <SelectItem value="android">Android</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" disabled={isSubmitting || !deviceId.trim()}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        {isSubmitting ? 'Registering...' : 'Register Device'}
                    </Button>
                </form>

                {registeredDevice && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-800">
                                    Device registered successfully
                                </p>
                                <p className="text-xs text-green-600 font-mono mt-1">
                                    {registeredDevice.deviceId}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleCopyId()}
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
