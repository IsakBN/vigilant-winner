'use client'

/**
 * Admin Subscriptions Page - Plan breakdowns, revenue metrics, recent changes
 */

import { useAdminStats, useRecentActivity } from '@/hooks/useAdmin'
import {
    Card, CardContent, CardHeader, CardTitle, Badge, Skeleton,
    Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui'
import { CreditCard, TrendingUp, Users, DollarSign } from 'lucide-react'

const PLANS: Record<string, { color: string; bar: string; price: number }> = {
    free: { color: 'bg-gray-100 text-gray-700', bar: 'bg-gray-300', price: 0 },
    pro: { color: 'bg-pastel-blue/20 text-pastel-blue', bar: 'bg-pastel-blue', price: 29 },
    team: { color: 'bg-pastel-green/20 text-pastel-green', bar: 'bg-pastel-green', price: 99 },
    enterprise: { color: 'bg-pastel-purple/20 text-pastel-purple', bar: 'bg-pastel-purple', price: 299 },
}

export default function AdminSubscriptionsPage() {
    const { data: stats, isLoading } = useAdminStats()
    const { data: activity, isLoading: activityLoading } = useRecentActivity({
        limit: 10, type: 'subscription_started',
    })

    const subs = stats?.subscriptions
    const byPlan = subs?.byPlan ?? {}
    const plans = Object.entries(byPlan).sort((a, b) => b[1] - a[1])
    const total = plans.reduce((sum, [, count]) => sum + count, 0)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-text-dark font-heading">Subscriptions</h1>
                <p className="text-text-light mt-1">Monitor plans, revenue, and recent changes</p>
            </div>

            <MetricsRow mrr={subs?.mrr ?? 0} churn={subs?.churnRate ?? 0} total={total} loading={isLoading} />
            <PlanCards plans={plans} total={total} loading={isLoading} />
            {!isLoading && plans.length > 0 && <DistributionBar plans={plans} total={total} />}
            <ActivityTable items={activity?.items ?? []} loading={activityLoading} />
        </div>
    )
}

function MetricsRow({ mrr, churn, total, loading }: { mrr: number; churn: number; total: number; loading: boolean }) {
    const items = [
        { label: 'MRR', value: `$${mrr.toLocaleString()}`, icon: DollarSign },
        { label: 'Subscribers', value: total.toLocaleString(), icon: Users },
        { label: 'Churn', value: `${churn.toFixed(2)}%`, icon: TrendingUp },
    ]

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {items.map(({ label, value, icon: Icon }) => (
                <Card key={label}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                            <Icon className="w-5 h-5 text-text-light" />
                        </div>
                        <div>
                            <p className="text-sm text-text-light">{label}</p>
                            {loading ? <Skeleton className="h-6 w-20 mt-1" /> : (
                                <p className="text-xl font-semibold text-text-dark">{value}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function PlanCards({ plans, total, loading }: { plans: [string, number][]; total: number; loading: boolean }) {
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}><CardContent className="p-4">
                        <Skeleton className="h-6 w-16 mb-2" /><Skeleton className="h-8 w-12 mb-1" /><Skeleton className="h-4 w-24" />
                    </CardContent></Card>
                ))}
            </div>
        )
    }

    const planMap = Object.fromEntries(plans)

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['free', 'pro', 'team', 'enterprise'].map((plan) => {
                const count = planMap[plan] ?? 0
                const cfg = PLANS[plan]
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
                return (
                    <Card key={plan}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className={cfg.color}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge>
                                <CreditCard className="w-4 h-4 text-text-light" />
                            </div>
                            <p className="text-2xl font-bold text-text-dark">{count}</p>
                            <p className="text-sm text-text-light">{pct}% of total</p>
                            <p className="text-sm text-text-light mt-1">${(count * cfg.price).toLocaleString()}/mo</p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

function DistributionBar({ plans, total }: { plans: [string, number][]; total: number }) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-lg font-semibold text-text-dark">Plan Distribution</CardTitle></CardHeader>
            <CardContent>
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                    {plans.map(([plan, count]) => (
                        <div key={plan} className={PLANS[plan.toLowerCase()]?.bar ?? 'bg-gray-300'}
                            style={{ width: `${(count / total) * 100}%` }}
                            title={`${plan}: ${count}`} />
                    ))}
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                    {plans.map(([plan, count]) => (
                        <div key={plan} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${PLANS[plan.toLowerCase()]?.bar ?? 'bg-gray-300'}`} />
                            <span className="text-sm text-text-light capitalize">{plan}: {count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

type ActivityItem = { id: string; userEmail: string; createdAt: number; metadata: Record<string, unknown> }

function ActivityTable({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-lg font-semibold text-text-dark">Recent Subscription Activity</CardTitle></CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3].map((i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-text-light">
                                    No recent subscription activity
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => {
                                const rawPlan = item.metadata.plan
                                const plan = typeof rawPlan === 'string' ? rawPlan : 'unknown'
                                const cfg = PLANS[plan.toLowerCase()] ?? PLANS.free
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.userEmail}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cfg.color}>
                                                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-text-light">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
