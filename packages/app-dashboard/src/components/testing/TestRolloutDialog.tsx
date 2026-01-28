'use client'

/**
 * TestRolloutDialog Component
 *
 * Dialog for testing release rollout to a specific device.
 */

import { useState } from 'react'
import { Send } from 'lucide-react'
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
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

interface TestRolloutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    devices: TestDevice[]
    onSubmit: (deviceId: string, releaseVersion: string) => void
    isSubmitting: boolean
}

// =============================================================================
// Component
// =============================================================================

export function TestRolloutDialog({
    open,
    onOpenChange,
    devices,
    onSubmit,
    isSubmitting,
}: TestRolloutDialogProps) {
    const [selectedDevice, setSelectedDevice] = useState('')
    const [releaseVersion, setReleaseVersion] = useState('1.0.0')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedDevice && releaseVersion) {
            onSubmit(selectedDevice, releaseVersion)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Test Release Rollout</DialogTitle>
                        <DialogDescription>
                            Push a specific release to a test device for verification
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="testDevice">Test Device</Label>
                            <Select
                                value={selectedDevice}
                                onValueChange={setSelectedDevice}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a device" />
                                </SelectTrigger>
                                <SelectContent>
                                    {devices.length === 0 ? (
                                        <SelectItem value="" disabled>
                                            No test devices registered
                                        </SelectItem>
                                    ) : (
                                        devices.map((device) => (
                                            <SelectItem
                                                key={device.deviceId}
                                                value={device.deviceId}
                                            >
                                                {device.name} ({device.platform})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="releaseVersion">Release Version</Label>
                            <Input
                                id="releaseVersion"
                                placeholder="1.0.0"
                                value={releaseVersion}
                                onChange={(e) => setReleaseVersion(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !selectedDevice || !releaseVersion}
                        >
                            <Send className="w-4 h-4 mr-1.5" />
                            {isSubmitting ? 'Sending...' : 'Send Update'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// =============================================================================
// Export Types
// =============================================================================

export type { TestDevice, TestRolloutDialogProps }
