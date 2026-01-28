'use client'

/**
 * DebugModeToggle Component
 *
 * Toggle switch for enabling debug mode in the SDK.
 */

import { Bug, Info } from 'lucide-react'
import {
    Card,
    CardContent,
    Switch,
    cn,
} from '@bundlenudge/shared-ui'

// =============================================================================
// Types
// =============================================================================

interface DebugModeToggleProps {
    enabled: boolean
    onToggle: (enabled: boolean) => void
    isLoading?: boolean
    className?: string
}

// =============================================================================
// Component
// =============================================================================

export function DebugModeToggle({
    enabled,
    onToggle,
    isLoading = false,
    className,
}: DebugModeToggleProps) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                enabled ? 'bg-amber-100' : 'bg-neutral-100'
                            )}
                        >
                            <Bug
                                className={cn(
                                    'w-5 h-5 transition-colors',
                                    enabled ? 'text-amber-600' : 'text-neutral-500'
                                )}
                            />
                        </div>
                        <div>
                            <p className="font-medium text-sm text-neutral-900">
                                Debug Mode
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Enable verbose logging for test devices
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={enabled}
                        onCheckedChange={onToggle}
                        disabled={isLoading}
                    />
                </div>

                {enabled && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-amber-800">
                                <p className="font-medium mb-1">Debug mode is enabled</p>
                                <ul className="space-y-0.5 text-amber-700">
                                    <li>- SDK will log all update check requests</li>
                                    <li>- Network requests will include debug headers</li>
                                    <li>- Test devices will receive detailed error messages</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
