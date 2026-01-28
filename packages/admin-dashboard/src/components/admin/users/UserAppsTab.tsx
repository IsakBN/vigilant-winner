'use client'

/**
 * UserAppsTab Component
 *
 * Displays apps created by the user.
 */

import { Badge, Label } from '@bundlenudge/shared-ui'
import type { UserTabProps } from './types'
import { formatDate } from './utils'

export function UserAppsTab({ user }: UserTabProps) {
    // For now, we show appsCount since detailed apps list may not be in AdminUserDetail
    // This can be expanded when the API returns full app data
    const appsCount = user.appsCount ?? 0

    if (appsCount === 0) {
        return (
            <div className="mt-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                    No apps created
                </p>
            </div>
        )
    }

    return (
        <div className="mt-4">
            <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Apps Overview</h4>
                    <Badge variant="outline">{String(appsCount)} apps</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    This user has created {String(appsCount)} app{appsCount === 1 ? '' : 's'}.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Account created: {formatDate(user.createdAt)}
                </p>
            </div>

            {/* Placeholder for expanded app list when API supports it */}
            <div className="mt-4 border rounded-lg p-4 bg-muted/20">
                <Label className="text-xs text-muted-foreground">Note</Label>
                <p className="text-sm text-muted-foreground mt-1">
                    Detailed app information will be available in a future update.
                    View the full apps list in the Apps management section.
                </p>
            </div>
        </div>
    )
}
