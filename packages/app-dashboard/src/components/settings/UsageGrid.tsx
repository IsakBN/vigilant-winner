'use client'

/**
 * UsageGrid Component
 *
 * Grid display of usage metric cards.
 */

import { UsageCard } from './UsageCard'
import type { UsageStats, PlanLimits } from '@/lib/api'

interface UsageGridProps {
    usage: UsageStats
    limits: PlanLimits
}

export function UsageGrid({ usage, limits }: UsageGridProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <UsageCard
                title="Monthly Active Users"
                value={usage.monthlyActiveUsers}
                limit={limits.monthlyActiveUsers}
                description="Unique devices this month"
            />
            <UsageCard
                title="Apps"
                value={usage.apps}
                limit={limits.apps}
                description="Active applications"
            />
            <UsageCard
                title="Storage Used"
                value={usage.storageUsedMb}
                limit={limits.storage ? limits.storage * 1024 : null}
                suffix="MB"
                limitSuffix="GB"
                limitMultiplier={1024}
                description="Bundle storage"
            />
            <UsageCard
                title="API Calls"
                value={usage.apiCalls}
                limit={limits.apiCalls}
                format="compact"
                description="This billing period"
            />
        </div>
    )
}
