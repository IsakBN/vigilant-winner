'use client'

/**
 * RolloutSlider Component
 *
 * Slider control for setting rollout percentage with preset buttons.
 */

import { cn, Slider, Button, Input } from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

interface RolloutSliderProps {
    value: number
    onChange: (value: number) => void
    disabled?: boolean
    className?: string
}

// =============================================================================
// Constants
// =============================================================================

const PRESETS = [10, 25, 50, 100] as const

// =============================================================================
// Component
// =============================================================================

export function RolloutSlider({
    value,
    onChange,
    disabled = false,
    className,
}: RolloutSliderProps) {
    const handleSliderChange = (values: number[]) => {
        const newValue = values[0]
        if (newValue !== undefined) {
            onChange(newValue)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = parseInt(e.target.value, 10)
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            onChange(numValue)
        }
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Label and Value Display */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                    Rollout Percentage
                </label>
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        min={0}
                        max={100}
                        value={value}
                        onChange={handleInputChange}
                        disabled={disabled}
                        className="w-16 h-8 text-center text-sm"
                    />
                    <span className="text-sm text-neutral-500">%</span>
                </div>
            </div>

            {/* Slider */}
            <Slider
                value={[value]}
                onValueChange={handleSliderChange}
                min={0}
                max={100}
                step={1}
                disabled={disabled}
                className="py-2"
            />

            {/* Preset Buttons */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 mr-2">Presets:</span>
                {PRESETS.map((preset) => (
                    <Button
                        key={preset}
                        type="button"
                        variant={value === preset ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onChange(preset)}
                        disabled={disabled}
                        className="min-w-[50px]"
                    >
                        {preset}%
                    </Button>
                ))}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
                <span
                    className={cn(
                        'w-2 h-2 rounded-full',
                        value === 0
                            ? 'bg-neutral-400'
                            : value < 100
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                    )}
                />
                <span className="text-neutral-500">
                    {value === 0
                        ? 'Paused - No users receiving updates'
                        : value < 100
                          ? `Gradual rollout - ${String(value)}% of users`
                          : 'Full rollout - All users'}
                </span>
            </div>
        </div>
    )
}
