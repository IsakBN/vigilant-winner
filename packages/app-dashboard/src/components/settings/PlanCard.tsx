'use client'

/**
 * PlanCard Component
 *
 * Displays subscription plan details with upgrade/downgrade options.
 */

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Badge,
} from '@bundlenudge/shared-ui'
import { Check } from 'lucide-react'

interface PlanLimits {
    monthlyActiveUsers: number | null
    apps: number | null
    storage: number | null
    apiCalls: number | null
    teamMembers: number | null
}

interface SubscriptionPlan {
    id: string
    name: string
    displayName: string
    priceCents: number
    interval: 'month' | 'year'
    features: string[]
    limits: PlanLimits
}

interface PlanCardProps {
    plan: SubscriptionPlan
    isCurrentPlan: boolean
    isLoading: boolean
    onSelect: (planId: string) => void
}

export function PlanCard({
    plan,
    isCurrentPlan,
    isLoading,
    onSelect,
}: PlanCardProps) {
    const priceDisplay =
        plan.priceCents === 0
            ? 'Free'
            : `$${(plan.priceCents / 100).toFixed(0)}`

    return (
        <Card
            className={
                isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''
            }
        >
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{plan.displayName}</CardTitle>
                    {isCurrentPlan && <Badge>Current</Badge>}
                </div>
                <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                        {priceDisplay}
                    </span>
                    {plan.priceCents > 0 && (
                        <span className="text-muted-foreground">
                            /{plan.interval}
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <LimitItem
                        label="Monthly Active Users"
                        value={plan.limits.monthlyActiveUsers}
                    />
                    <LimitItem label="Apps" value={plan.limits.apps} />
                    <LimitItem
                        label="Storage"
                        value={plan.limits.storage}
                        suffix="GB"
                    />
                    <LimitItem
                        label="API Calls"
                        value={plan.limits.apiCalls}
                        suffix="/mo"
                    />
                    <LimitItem
                        label="Team Members"
                        value={plan.limits.teamMembers}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => onSelect(plan.id)}
                >
                    {isCurrentPlan
                        ? 'Current Plan'
                        : isLoading
                          ? 'Processing...'
                          : plan.priceCents === 0
                            ? 'Downgrade'
                            : 'Upgrade'}
                </Button>
            </CardFooter>
        </Card>
    )
}

function LimitItem({
    label,
    value,
    suffix,
}: {
    label: string
    value: number | null
    suffix?: string
}) {
    const displayValue =
        value === null
            ? 'Unlimited'
            : `${value.toLocaleString()}${suffix ?? ''}`

    return (
        <div className="flex justify-between">
            <span>{label}</span>
            <span className="font-medium text-foreground">{displayValue}</span>
        </div>
    )
}
