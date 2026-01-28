'use client'

/**
 * FlagTargetingFields Component
 *
 * Targeting configuration fields for feature flags:
 * - Rollout percentage slider
 * - Target organization IDs
 * - Target plan types
 */

import {
    Label,
    Input,
    Slider,
    Button,
} from '@bundlenudge/shared-ui'
import type { OrgPlan } from '@/lib/api/types'

const PLAN_OPTIONS: OrgPlan[] = ['free', 'pro', 'enterprise']

export interface FlagTargetingFieldsProps {
    rolloutPercentage: number
    onRolloutChange: (value: number) => void
    targetOrgIds: string
    onTargetOrgIdsChange: (value: string) => void
    targetPlanTypes: OrgPlan[]
    onPlanTypeToggle: (plan: OrgPlan) => void
}

export function FlagTargetingFields({
    rolloutPercentage,
    onRolloutChange,
    targetOrgIds,
    onTargetOrgIdsChange,
    targetPlanTypes,
    onPlanTypeToggle,
}: FlagTargetingFieldsProps) {
    return (
        <>
            {/* Rollout Percentage */}
            <div className="space-y-2">
                <Label>Rollout Percentage: {String(rolloutPercentage)}%</Label>
                <Slider
                    value={[rolloutPercentage]}
                    onValueChange={([v]) => onRolloutChange(v)}
                    max={100}
                    step={1}
                />
            </div>

            {/* Target Org IDs */}
            <div className="space-y-2">
                <Label htmlFor="targetOrgIds">Target Organization IDs</Label>
                <Input
                    id="targetOrgIds"
                    value={targetOrgIds}
                    onChange={(e) => onTargetOrgIdsChange(e.target.value)}
                    placeholder="org_1, org_2, org_3"
                />
                <p className="text-xs text-text-light">
                    Comma-separated list. Leave empty to target all organizations.
                </p>
            </div>

            {/* Target Plan Types */}
            <div className="space-y-2">
                <Label>Target Plan Types</Label>
                <div className="flex gap-2">
                    {PLAN_OPTIONS.map((plan) => (
                        <Button
                            key={plan}
                            type="button"
                            variant={targetPlanTypes.includes(plan) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPlanTypeToggle(plan)}
                        >
                            {plan}
                        </Button>
                    ))}
                </div>
                <p className="text-xs text-text-light">
                    Select none to target all plans.
                </p>
            </div>
        </>
    )
}
