'use client'

/**
 * DangerZone Component
 *
 * Danger zone section with leave team and delete team actions.
 */

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'
import { LeaveTeamDialog } from './LeaveTeamDialog'
import { DeleteTeamDialog } from './DeleteTeamDialog'

interface DangerZoneProps {
    teamName: string
    isOwner: boolean
    onLeaveTeam: () => Promise<void>
    onDeleteTeam: () => Promise<void>
    isLeavePending: boolean
    isDeletePending: boolean
}

export function DangerZone({
    teamName,
    isOwner,
    onLeaveTeam,
    onDeleteTeam,
    isLeavePending,
    isDeletePending,
}: DangerZoneProps) {
    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                    Irreversible actions that will permanently affect your team.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <hr className="border-border" />

                {/* Leave Team Section */}
                {!isOwner && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">Leave this team</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                You will lose access to all team resources and will need
                                to be re-invited to rejoin.
                            </p>
                        </div>
                        <LeaveTeamDialog
                            teamName={teamName}
                            onConfirm={onLeaveTeam}
                            isPending={isLeavePending}
                        />
                    </div>
                )}

                {/* Delete Team Section - Owner Only */}
                {isOwner && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">Delete this team</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Once you delete a team, there is no going back. All team members
                                will lose access, and all team data will be permanently deleted.
                            </p>
                        </div>
                        <DeleteTeamDialog
                            teamName={teamName}
                            onConfirm={onDeleteTeam}
                            isPending={isDeletePending}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
