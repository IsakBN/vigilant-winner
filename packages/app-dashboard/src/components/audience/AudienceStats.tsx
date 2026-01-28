'use client'

/**
 * AudienceStats Component
 *
 * Displays overview statistics for testers.
 */

import { Card, CardContent } from '@bundlenudge/shared-ui'
import type { Tester } from '@/lib/api'

interface AudienceStatsProps {
    testers: Tester[]
}

export function AudienceStats({ testers }: AudienceStatsProps) {
    const totalTesters = testers.length
    const totalEmailsSent = testers.reduce(
        (sum, t) => sum + (t.stats?.totalSent ?? 0),
        0
    )
    const totalEmailsOpened = testers.reduce(
        (sum, t) => sum + (t.stats?.totalOpened ?? 0),
        0
    )

    return (
        <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-semibold text-neutral-900">
                        {totalTesters}
                    </div>
                    <div className="text-sm text-neutral-500">Total Testers</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-semibold text-neutral-900">
                        {totalEmailsSent}
                    </div>
                    <div className="text-sm text-neutral-500">Emails Sent</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-semibold text-neutral-900">
                        {totalEmailsOpened}
                    </div>
                    <div className="text-sm text-neutral-500">Emails Opened</div>
                </CardContent>
            </Card>
        </div>
    )
}
