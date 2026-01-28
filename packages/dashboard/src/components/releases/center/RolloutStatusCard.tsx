'use client'

/**
 * RolloutStatusCard Component
 *
 * Displays the current rollout status with a large percentage display
 * and progress bar visualization.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface RolloutStatusCardProps {
    percentage: number
    isActive: boolean
    isPaused: boolean
}

// =============================================================================
// Component
// =============================================================================

export function RolloutStatusCard({ percentage, isActive, isPaused }: RolloutStatusCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Current Rollout Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Large percentage display */}
                    <div className="text-center">
                        <span className="text-5xl font-bold text-neutral-900">
                            {percentage}%
                        </span>
                        <p className="text-sm text-neutral-500 mt-2">
                            {percentage === 0
                                ? 'No users receiving updates'
                                : percentage < 100
                                    ? `${String(percentage)}% of users receiving updates`
                                    : 'All users receiving updates'}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full transition-all duration-500',
                                isPaused ? 'bg-amber-500' : 'bg-blue-500'
                            )}
                            style={{ width: `${String(percentage)}%` }}
                        />
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center justify-center gap-2">
                        <span
                            className={cn(
                                'w-2 h-2 rounded-full',
                                isActive ? 'bg-green-500 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-neutral-400'
                            )}
                        />
                        <span className="text-sm text-neutral-600">
                            {isActive ? 'Rolling out' : isPaused ? 'Paused' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
