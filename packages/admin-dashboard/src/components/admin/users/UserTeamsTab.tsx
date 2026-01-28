'use client'

/**
 * UserTeamsTab Component
 *
 * Displays team memberships for the user.
 */

import { Badge, Label } from '@bundlenudge/shared-ui'
import type { UserTabProps } from './types'
import { formatDate } from './utils'

export function UserTeamsTab({ user }: UserTabProps) {
    // For now, we show teamsCount since detailed teams list may not be in AdminUserDetail
    // This can be expanded when the API returns full team data
    const teamsCount = user.teamsCount ?? 0

    if (teamsCount === 0) {
        return (
            <div className="mt-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                    Not a member of any teams
                </p>
            </div>
        )
    }

    return (
        <div className="mt-4 space-y-4">
            {/* Teams Overview */}
            <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Team Memberships</h4>
                    <Badge variant="outline">{String(teamsCount)} teams</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    This user is a member of {String(teamsCount)} team{teamsCount === 1 ? '' : 's'}.
                </p>
            </div>

            {/* Account info */}
            <div className="border rounded-lg p-4">
                <Label className="text-xs text-muted-foreground">Account Info</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <p className="text-xs text-muted-foreground">Apps</p>
                        <p className="text-sm font-medium">{String(user.appsCount ?? 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Member Since</p>
                        <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                </div>
            </div>

            {/* Placeholder for expanded team list when API supports it */}
            <div className="border rounded-lg p-4 bg-muted/20">
                <Label className="text-xs text-muted-foreground">Note</Label>
                <p className="text-sm text-muted-foreground mt-1">
                    Detailed team information will be available in a future update.
                    View the full organizations list in the Organizations management section.
                </p>
            </div>
        </div>
    )
}
