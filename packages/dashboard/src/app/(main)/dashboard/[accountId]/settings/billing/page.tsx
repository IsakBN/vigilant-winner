'use client'

/**
 * Billing Page
 *
 * Subscription management, plan selection, and invoice history.
 */

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    useSubscription,
    usePlans,
    useInvoices,
    useCreateCheckout,
    useCreatePortal,
} from '@/hooks/useBilling'
import { PlanCard, InvoiceTable } from '@/components/settings'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function BillingPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const accountId = params.accountId as string

    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const { data: subscriptionData, isLoading: subLoading } =
        useSubscription(accountId)
    const { data: plansData, isLoading: plansLoading } = usePlans()
    const { data: invoicesData, isLoading: invoicesLoading } =
        useInvoices(accountId)

    const createCheckout = useCreateCheckout(accountId)
    const createPortal = useCreatePortal(accountId)

    // Handle Stripe redirect
    useEffect(() => {
        const success = searchParams.get('success')
        const canceled = searchParams.get('canceled')

        if (success === 'true') {
            setSuccessMessage('Your subscription has been updated!')
            window.history.replaceState(
                {},
                '',
                `/dashboard/${accountId}/settings/billing`
            )
        } else if (canceled === 'true') {
            window.history.replaceState(
                {},
                '',
                `/dashboard/${accountId}/settings/billing`
            )
        }
    }, [searchParams, accountId])

    const isLoading = subLoading || plansLoading

    if (isLoading) {
        return <BillingSkeleton />
    }

    const { subscription, plan, isFreeTier } = subscriptionData ?? {}
    const plans = plansData?.plans ?? []
    const invoices = invoicesData?.invoices ?? []

    return (
        <div className="space-y-6">
            {successMessage && (
                <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)}>
                        <span className="sr-only">Dismiss</span>
                        <span aria-hidden>&times;</span>
                    </button>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>
                                {isFreeTier
                                    ? 'Upgrade to unlock more features'
                                    : 'Manage your subscription'}
                            </CardDescription>
                        </div>
                        {!isFreeTier && (
                            <Button
                                variant="outline"
                                onClick={() => createPortal.mutate()}
                                disabled={createPortal.isPending}
                            >
                                {createPortal.isPending
                                    ? 'Loading...'
                                    : 'Manage Subscription'}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="text-xl font-semibold">
                                {plan?.displayName ?? 'Free'}
                            </h3>
                            {subscription && (
                                <p className="text-sm text-muted-foreground">
                                    <Badge
                                        variant={
                                            subscription.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {subscription.status}
                                    </Badge>
                                    {subscription.currentPeriodEnd && (
                                        <span className="ml-2">
                                            Renews{' '}
                                            {formatDate(
                                                subscription.currentPeriodEnd
                                            )}
                                        </span>
                                    )}
                                    {subscription.cancelAtPeriodEnd && (
                                        <span className="ml-2 text-destructive">
                                            Cancels at period end
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                    <CardDescription>
                        Choose the plan that fits your needs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {plans.map((p) => (
                            <PlanCard
                                key={p.id}
                                plan={p}
                                isCurrentPlan={p.name === plan?.name}
                                isLoading={createCheckout.isPending}
                                onSelect={(planId) =>
                                    createCheckout.mutate(planId)
                                }
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>
                        View and download past invoices
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {invoicesLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <InvoiceTable invoices={invoices} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function BillingSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-12 w-40" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
