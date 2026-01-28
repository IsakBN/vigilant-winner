'use client'

/**
 * RolloutControlCard - Controls for rollout percentage, channel, and status.
 */

import { useState, useCallback } from 'react'
import { Loader2, Play, RotateCcw, AlertTriangle } from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Slider,
    Switch,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@bundlenudge/shared-ui'
import type { ReleaseStatus } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface RolloutControlCardProps {
    releaseId: string
    channel: string
    rolloutPercentage: number
    status: ReleaseStatus
    isPending: boolean
    onRolloutChange: (percentage: number) => Promise<void>
    onChannelChange: (channel: string) => Promise<void>
    onToggleStatus: () => Promise<void>
    onDisable: () => Promise<void>
}

// =============================================================================
// Component
// =============================================================================

export function RolloutControlCard({
    channel,
    rolloutPercentage,
    status,
    isPending,
    onRolloutChange,
    onChannelChange,
    onToggleStatus,
    onDisable,
}: RolloutControlCardProps) {
    const [rolloutValue, setRolloutValue] = useState<number | null>(null)
    const [disableDialogOpen, setDisableDialogOpen] = useState(false)

    const currentRollout = rolloutValue ?? rolloutPercentage
    const isActive = status === 'active' || status === 'rolling'

    const handleRolloutChange = useCallback((values: number[]) => {
        setRolloutValue(values[0])
    }, [])

    const handleRolloutCommit = useCallback(async () => {
        if (rolloutValue === null || rolloutValue === rolloutPercentage) return
        await onRolloutChange(rolloutValue)
    }, [rolloutValue, rolloutPercentage, onRolloutChange])

    const handleDisableConfirm = useCallback(async () => {
        await onDisable()
        setDisableDialogOpen(false)
    }, [onDisable])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Rollout Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Rollout Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Rollout Percentage</Label>
                        <span className="text-lg font-semibold text-neutral-900">
                            {currentRollout}%
                        </span>
                    </div>
                    <Slider
                        value={[currentRollout]}
                        onValueChange={handleRolloutChange}
                        onValueCommit={handleRolloutCommit}
                        min={0}
                        max={100}
                        step={5}
                        disabled={isPending}
                    />
                    {isPending && (
                        <p className="text-sm text-neutral-500 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                        </p>
                    )}
                </div>

                {/* Channel Selection */}
                <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select
                        value={channel}
                        onValueChange={onChannelChange}
                        disabled={isPending}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Toggle & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={isActive}
                            onCheckedChange={onToggleStatus}
                            disabled={isPending}
                        />
                        <Label className="cursor-pointer" onClick={onToggleStatus}>
                            {isActive ? 'Active' : 'Paused'}
                        </Label>
                        {!isActive && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToggleStatus}
                                disabled={isPending}
                            >
                                <Play className="w-4 h-4 mr-1" />
                                Resume
                            </Button>
                        )}
                    </div>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDisableDialogOpen(true)}
                    >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        Disable Release
                    </Button>
                </div>
            </CardContent>

            {/* Disable Confirmation Dialog */}
            <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Disable Release?
                        </DialogTitle>
                        <DialogDescription>
                            This will stop all devices from receiving this release.
                            You can re-enable it later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDisableDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisableConfirm}
                        >
                            Disable Release
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
