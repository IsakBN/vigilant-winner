'use client'

/**
 * SubscriptionsTable Component
 *
 * Displays subscriptions in a table with:
 * - User email/name
 * - Plan badge
 * - Status badge
 * - Period end date
 * - Trial info
 * - Click to view action
 */

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Skeleton,
    Button,
} from '@bundlenudge/shared-ui'
import type { SubscriptionStatus, SubscriptionPlan } from './SubscriptionsFilters'

export interface Subscription {
    id: string
    userId: string
    userEmail: string | null
    userName: string | null
    planName: SubscriptionPlan
    planDisplayName: string | null
    status: SubscriptionStatus
    currentPeriodEnd: number | null
    trialEnd: number | null
    isTrialing: boolean
    createdAt: number
}

export interface SubscriptionsTableProps {
    subscriptions: Subscription[]
    isLoading: boolean
    onSubscriptionClick: (subscriptionId: string) => void
    onUserClick: (userId: string) => void
}

export function SubscriptionsTable({
    subscriptions,
    isLoading,
    onSubscriptionClick,
    onUserClick,
}: SubscriptionsTableProps) {
    if (isLoading) {
        return <SubscriptionsTableSkeleton />
    }

    if (subscriptions.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <p className="text-text-light">No subscriptions match your filters</p>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Period End</TableHead>
                        <TableHead>Trial</TableHead>
                        <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscriptions.map((sub) => (
                        <TableRow key={sub.id} className="hover:bg-muted/50">
                            <TableCell className="px-4">
                                <UserCell
                                    email={sub.userEmail}
                                    name={sub.userName}
                                />
                            </TableCell>
                            <TableCell>
                                <PlanBadge plan={sub.planName} displayName={sub.planDisplayName} />
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={sub.status} />
                            </TableCell>
                            <TableCell className="text-sm text-text-light">
                                <PeriodEndCell periodEnd={sub.currentPeriodEnd} />
                            </TableCell>
                            <TableCell>
                                <TrialCell isTrialing={sub.isTrialing} trialEnd={sub.trialEnd} />
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => onSubscriptionClick(sub.id)}
                                        className="text-bright-accent hover:text-bright-accent/80"
                                    >
                                        View
                                    </Button>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => onUserClick(sub.userId)}
                                        className="text-text-light hover:text-text-dark"
                                    >
                                        User
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

// =============================================================================
// Sub-components
// =============================================================================

interface UserCellProps {
    email: string | null
    name: string | null
}

function UserCell({ email, name }: UserCellProps) {
    return (
        <div>
            <div className="text-sm font-medium text-text-dark">
                {email ?? <span className="text-text-light italic">No email</span>}
            </div>
            {name && (
                <div className="text-xs text-text-light">{name}</div>
            )}
        </div>
    )
}

interface PlanBadgeProps {
    plan: SubscriptionPlan
    displayName: string | null
}

function PlanBadge({ plan, displayName }: PlanBadgeProps) {
    return (
        <Badge className={PLAN_BADGE_CLASSES[plan]}>
            {displayName ?? PLAN_LABELS[plan]}
        </Badge>
    )
}

interface StatusBadgeProps {
    status: SubscriptionStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <Badge className={STATUS_BADGE_CLASSES[status]}>
            {STATUS_LABELS[status]}
        </Badge>
    )
}

interface PeriodEndCellProps {
    periodEnd: number | null
}

function PeriodEndCell({ periodEnd }: PeriodEndCellProps) {
    if (!periodEnd) return <span>-</span>

    const daysRemaining = getDaysRemaining(periodEnd)
    const dateStr = formatDate(periodEnd)

    return (
        <span>
            {dateStr}
            {daysRemaining !== null && daysRemaining <= 7 && (
                <span className="text-orange-500 ml-1">({String(daysRemaining)}d)</span>
            )}
        </span>
    )
}

interface TrialCellProps {
    isTrialing: boolean
    trialEnd: number | null
}

function TrialCell({ isTrialing, trialEnd }: TrialCellProps) {
    if (!isTrialing || !trialEnd) {
        return <span className="text-text-light">-</span>
    }

    return (
        <span className="text-sm text-blue-600">
            Ends {formatDate(trialEnd)}
        </span>
    )
}

function SubscriptionsTableSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="px-4">User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Period End</TableHead>
                        <TableHead>Trial</TableHead>
                        <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4">
                                <div>
                                    <Skeleton className="h-4 w-40 mb-1" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

// =============================================================================
// Constants
// =============================================================================

const PLAN_BADGE_CLASSES: Record<SubscriptionPlan, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-yellow-100 text-yellow-700',
    pro: 'bg-green-100 text-green-700',
    team: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700',
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    team: 'Team',
    enterprise: 'Enterprise',
}

const STATUS_BADGE_CLASSES: Record<SubscriptionStatus, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
    expired: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
    active: 'Active',
    trialing: 'Trialing',
    past_due: 'Past Due',
    cancelled: 'Cancelled',
    expired: 'Expired',
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function getDaysRemaining(periodEnd: number): number | null {
    const now = Date.now()
    const diff = periodEnd - now
    if (diff < 0) return null
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
