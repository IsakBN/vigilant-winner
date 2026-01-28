'use client'

/**
 * SimulateUpdateForm Component
 *
 * Form to simulate an update check for a specific device or configuration.
 */

import { useState, useCallback } from 'react'
import { RefreshCw, Play, Code } from 'lucide-react'
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
    Switch,
} from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

interface SimulateUpdateFormProps {
    appId: string
    channels?: { id: string; name: string }[]
    onSimulate?: (result: SimulationResult) => void
}

interface SimulationResult {
    updateAvailable: boolean
    currentVersion: string
    targetVersion: string | null
    channel: string
    timestamp: number
    responseTime: number
    metadata?: {
        mandatory: boolean
        downloadUrl: string | null
        releaseNotes: string | null
    }
}

// =============================================================================
// Component
// =============================================================================

export function SimulateUpdateForm({
    appId: _appId,
    channels = [],
    onSimulate,
}: SimulateUpdateFormProps) {
    const [deviceId, setDeviceId] = useState('')
    const [appVersion, setAppVersion] = useState('1.0.0')
    const [channel, setChannel] = useState('production')
    const [platform, setPlatform] = useState<'ios' | 'android'>('ios')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [isSimulating, setIsSimulating] = useState(false)
    const [result, setResult] = useState<SimulationResult | null>(null)

    const handleSimulate = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            setIsSimulating(true)
            setResult(null)

            const startTime = Date.now()

            try {
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 800))

                const simulationResult: SimulationResult = {
                    updateAvailable: Math.random() > 0.3,
                    currentVersion: appVersion,
                    targetVersion: Math.random() > 0.3 ? '1.1.0' : null,
                    channel,
                    timestamp: Date.now(),
                    responseTime: Date.now() - startTime,
                    metadata: {
                        mandatory: Math.random() > 0.7,
                        downloadUrl: Math.random() > 0.3 ? 'https://storage.bundlenudge.com/...' : null,
                        releaseNotes: Math.random() > 0.5 ? 'Bug fixes and improvements' : null,
                    },
                }

                setResult(simulationResult)
                onSimulate?.(simulationResult)
            } finally {
                setIsSimulating(false)
            }
        },
        [appVersion, channel, onSimulate]
    )

    const defaultChannels = [
        { id: 'production', name: 'Production' },
        { id: 'beta', name: 'Beta' },
        { id: 'alpha', name: 'Alpha' },
    ]

    const channelList = channels.length > 0 ? channels : defaultChannels

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <RefreshCw className="w-4 h-4 text-neutral-500" />
                    Simulate Update Check
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => void handleSimulate(e)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="simAppVersion">App Version</Label>
                            <Input
                                id="simAppVersion"
                                placeholder="1.0.0"
                                value={appVersion}
                                onChange={(e) => setAppVersion(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="simChannel">Channel</Label>
                            <Select value={channel} onValueChange={setChannel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {channelList.map((ch) => (
                                        <SelectItem key={ch.id} value={ch.id}>
                                            {ch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="showAdvanced" className="cursor-pointer">
                            Advanced options
                        </Label>
                        <Switch
                            id="showAdvanced"
                            checked={showAdvanced}
                            onCheckedChange={setShowAdvanced}
                        />
                    </div>

                    {showAdvanced && (
                        <div className="space-y-4 pt-2 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="simDeviceId">Device ID (optional)</Label>
                                <Input
                                    id="simDeviceId"
                                    placeholder="Leave empty for anonymous"
                                    value={deviceId}
                                    onChange={(e) => setDeviceId(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="simPlatform">Platform</Label>
                                <Select
                                    value={platform}
                                    onValueChange={(v: 'ios' | 'android') => setPlatform(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ios">iOS</SelectItem>
                                        <SelectItem value="android">Android</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <Button type="submit" disabled={isSimulating}>
                        <Play className="w-4 h-4 mr-1.5" />
                        {isSimulating ? 'Simulating...' : 'Run Simulation'}
                    </Button>
                </form>

                {result && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Code className="w-4 h-4 text-neutral-500" />
                            <span className="text-sm font-medium">Response</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {result.responseTime}ms
                            </span>
                        </div>
                        <pre className="p-3 bg-neutral-900 text-neutral-100 rounded-lg text-xs overflow-x-auto">
{JSON.stringify(
    {
        updateAvailable: result.updateAvailable,
        currentVersion: result.currentVersion,
        targetVersion: result.targetVersion,
        channel: result.channel,
        ...result.metadata,
    },
    null,
    2
)}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
