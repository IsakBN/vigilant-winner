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
} from '@/hooks'
import {
    PlanCard,
    InvoiceTable,
    BillingSettingsSkeleton,
} from '@/components/settings'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    Skeleton,
} from '@bundlenudge/shared-ui'

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
        return <BillingSettingsSkeleton />
    }

    const { subscription, plan, isFreeTier } = subscriptionData ?? {}
    const plans = plansData?.plans ?? []
    const invoices = invoicesData?.invoices ?? []

    return (
        <div className="space-y-6">
            <SuccessAlert
                message={successMessage}
                onDismiss={() => setSuccessMessage(null)}
            />

            <CurrentPlanCard
                plan={plan}
                subscription={subscription}
                isFreeTier={isFreeTier ?? true}
                onManageSubscription={() => createPortal.mutate()}
                isManaging={createPortal.isPending}
            />

            <AvailablePlansCard
                plans={plans}
                currentPlanName={plan?.name}
                onSelectPlan={(planId) => createCheckout.mutate(planId)}
                isLoading={createCheckout.isPending}
            />

            <div className="border-t border-border" />

            <InvoiceHistoryCard
                invoices={invoices}
                isLoading={invoicesLoading}
            />
        </div>
    )
}

// =============================================================================
// Sub-components
// =============================================================================

interface SuccessAlertProps {
    message: string | null
    onDismiss: () => void
}

function SuccessAlert({ message, onDismiss }: SuccessAlertProps) {
    if (!message) return null

    return (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <span>{message}</span>
            <button onClick={onDismiss}>
                <span className="sr-only">Dismiss</span>
                <span aria-hidden>&times;</span>
            </button>
        </div>
    )
}

interface CurrentPlanCardProps {
    plan?: { displayName: string; name: string }
    subscription?: {
        status: string
        currentPeriodEnd?: number
        cancelAtPeriodEnd?: boolean
    } | null
    isFreeTier: boolean
    onManageSubscription: () => void
    isManaging: boolean
}

function CurrentPlanCard({
    plan,
    subscription,
    isFreeTier,
    onManageSubscription,
    isManaging,
}: CurrentPlanCardProps) {
    return (
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
                            onClick={onManageSubscription}
                            disabled={isManaging}
                        >
                            {isManaging ? 'Loading...' : 'Manage Subscription'}
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
    )
}

interface AvailablePlansCardProps {
    plans: {
        id: string
        name: string
        displayName: string
        priceCents: number
        interval: 'month' | 'year'
        features: string[]
        limits: {
            monthlyActiveUsers: number | null
            apps: number | null
            storage: number | null
            apiCalls: number | null
            teamMembers: number | null
        }
    }[]
    currentPlanName?: string
    onSelectPlan: (planId: string) => void
    isLoading: boolean
}

function AvailablePlansCard({
    plans,
    currentPlanName,
    onSelectPlan,
    isLoading,
}: AvailablePlansCardProps) {
    return (
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
                            isCurrentPlan={p.name === currentPlanName}
                            isLoading={isLoading}
                            onSelect={onSelectPlan}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

interface InvoiceHistoryCardProps {
    invoices: {
        id: string
        invoiceDate: number
        amountCents: number
        status: 'paid' | 'open' | 'draft' | 'void' | 'uncollectible'
        invoicePdf?: string | null
        stripeInvoiceId?: string | null
    }[]
    isLoading: boolean
}

function InvoiceHistoryCard({ invoices, isLoading }: InvoiceHistoryCardProps) {
    // Transform invoices to convert null to undefined for InvoiceTable compatibility
    const normalizedInvoices = invoices.map((inv) => ({
        ...inv,
        invoicePdf: inv.invoicePdf ?? undefined,
        stripeInvoiceId: inv.stripeInvoiceId ?? undefined,
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>
                    View and download past invoices
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <InvoiceTable invoices={normalizedInvoices} />
                )}
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Utilities
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
