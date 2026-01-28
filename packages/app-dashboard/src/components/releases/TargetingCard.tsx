'use client'

/**
 * TargetingCard Component
 *
 * Card for version targeting and rollout percentage in release form.
 */

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Slider,
} from '@bundlenudge/shared-ui'
import type { ReleaseFormState } from './types'

interface TargetingCardProps {
    form: ReleaseFormState
    onUpdateField: <K extends keyof ReleaseFormState>(
        field: K,
        value: ReleaseFormState[K]
    ) => void
}

export function TargetingCard({ form, onUpdateField }: TargetingCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Targeting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="minAppVersion">Min App Version</Label>
                        <Input
                            id="minAppVersion"
                            placeholder="1.0.0"
                            value={form.minAppVersion}
                            onChange={(e) => onUpdateField('minAppVersion', e.target.value)}
                        />
                        <p className="text-xs text-neutral-400">
                            Only apps {'>='} this version will receive the update
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maxAppVersion">Max App Version</Label>
                        <Input
                            id="maxAppVersion"
                            placeholder="2.0.0"
                            value={form.maxAppVersion}
                            onChange={(e) => onUpdateField('maxAppVersion', e.target.value)}
                        />
                        <p className="text-xs text-neutral-400">
                            Only apps {'<='} this version will receive the update
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Rollout Percentage</Label>
                        <span className="text-sm font-medium text-neutral-900">
                            {String(form.rolloutPercentage)}%
                        </span>
                    </div>
                    <Slider
                        value={[form.rolloutPercentage]}
                        onValueChange={([value]) => onUpdateField('rolloutPercentage', value)}
                        min={0}
                        max={100}
                        step={5}
                    />
                    <p className="text-xs text-neutral-400">
                        Start with a lower percentage to safely roll out to a subset of users
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
