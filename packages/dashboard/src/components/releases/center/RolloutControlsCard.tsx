'use client'

/**
 * RolloutControlsCard Component
 *
 * Provides controls for managing rollout: slider, presets, pause/resume, rollback.
 */

import { useState } from 'react'
import {
    RotateCcw,
    AlertTriangle,
    Loader2,
    Play,
    Pause,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// =============================================================================
// Types
// =============================================================================

interface RolloutControlsCardProps {
    percentage: number
    isActive: boolean
    isPending: boolean
    onPercentageChange: (values: number[]) => void
    onPercentageCommit: () => void
    onPresetClick: (preset: number) => void
    onPauseResume: () => void
    onRollback: (reason: string) => void
}

// =============================================================================
// Constants
// =============================================================================

const ROLLOUT_PRESETS = [10, 25, 50, 100] as const

// =============================================================================
// Component
// =============================================================================

export function RolloutControlsCard({
    percentage,
    isActive,
    isPending,
    onPercentageChange,
    onPercentageCommit,
    onPresetClick,
    onPauseResume,
    onRollback,
}: RolloutControlsCardProps) {
    const [rollbackReason, setRollbackReason] = useState('')
    const [inputValue, setInputValue] = useState(String(percentage))

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        const val = parseInt(e.target.value, 10)
        if (!isNaN(val) && val >= 0 && val <= 100) {
            onPercentageChange([val])
        }
    }

    const handleRollbackConfirm = () => {
        onRollback(rollbackReason)
        setRollbackReason('')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Rollout Controls
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">
                            Rollout Percentage
                        </span>
                        <div className="flex items-center gap-1">
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={inputValue}
                                onChange={handleInputChange}
                                onBlur={onPercentageCommit}
                                disabled={isPending}
                                className="w-16 h-8 text-center text-sm"
                            />
                            <span className="text-sm text-neutral-500">%</span>
                        </div>
                    </div>

                    <Slider
                        value={[percentage]}
                        onValueChange={onPercentageChange}
                        onValueCommit={onPercentageCommit}
                        min={0}
                        max={100}
                        step={1}
                        disabled={isPending}
                    />
                </div>

                {/* Preset buttons */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 mr-2">Presets:</span>
                    {ROLLOUT_PRESETS.map((preset) => (
                        <Button
                            key={preset}
                            type="button"
                            variant={percentage === preset ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPresetClick(preset)}
                            disabled={isPending}
                            className="min-w-[50px]"
                        >
                            {preset}%
                        </Button>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                    <Button
                        variant={isActive ? 'outline' : 'default'}
                        size="sm"
                        onClick={onPauseResume}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : isActive ? (
                            <Pause className="w-4 h-4 mr-1.5" />
                        ) : (
                            <Play className="w-4 h-4 mr-1.5" />
                        )}
                        {isActive ? 'Pause' : 'Resume'}
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <RotateCcw className="w-4 h-4 mr-1.5" />
                                Rollback
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    Confirm Rollback
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-4">
                                        <p>
                                            This will disable the current release and revert all devices to the previous version.
                                            This action cannot be undone.
                                        </p>
                                        <div>
                                            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                                                Reason (optional)
                                            </label>
                                            <Input
                                                placeholder="e.g., Critical bug in checkout flow"
                                                value={rollbackReason}
                                                onChange={(e) => setRollbackReason(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleRollbackConfirm}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                            Rolling back...
                                        </>
                                    ) : (
                                        'Confirm Rollback'
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}
