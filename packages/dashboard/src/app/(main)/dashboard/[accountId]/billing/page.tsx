'use client'

/**
 * Billing Page
 *
 * Manage subscription plans, view usage, and access billing portal.
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import {
  useSubscription,
  usePlans,
  useUsage,
  useCreateCheckout,
  useCreatePortal,
} from '@/hooks/useBilling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface UsageStatProps {
  label: string
  value: number
  limit: number | null
  suffix?: string
  format?: 'compact' | 'default'
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCompact(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

// ============================================================================
// Components
// ============================================================================

function PageSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function UsageStat({ label, value, limit, suffix, format }: UsageStatProps) {
  const displayValue = format === 'compact'
    ? formatCompact(value)
    : value.toLocaleString()

  const percentage = limit ? Math.min((value / limit) * 100, 100) : null

  return (
    <div>
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold text-neutral-900">
        {displayValue}
        {suffix && <span className="text-sm font-normal text-neutral-500 ml-1">{suffix}</span>}
        {limit && (
          <span className="text-sm font-normal text-neutral-400">
            {' '}/ {limit.toLocaleString()}
          </span>
        )}
      </div>
      {percentage !== null && (
        <div className="mt-2 h-1.5 bg-neutral-100 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              percentage > 90 ? 'bg-destructive' :
              percentage > 75 ? 'bg-amber-500' :
              'bg-neutral-900'
            )}
            style={{ width: `${String(percentage)}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function BillingPage() {
  const { isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const params = useParams()
  const accountId = params.accountId as string

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch data
  const { data: subscriptionData, isLoading: subscriptionLoading } = useSubscription(accountId)
  const { data: plansData, isLoading: plansLoading } = usePlans()
  const { data: usageData, isLoading: usageLoading } = useUsage(accountId)

  // Mutations
  const createCheckout = useCreateCheckout(accountId)
  const createPortal = useCreatePortal(accountId)

  const loading = authLoading || subscriptionLoading || plansLoading || usageLoading

  // Track if we've triggered auto-upgrade
  const [autoUpgradeTriggered, setAutoUpgradeTriggered] = useState(false)

  // Handle URL params for Stripe redirects
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const upgradePlan = searchParams.get('upgrade')

    if (success === 'true') {
      setSuccessMessage('Your subscription has been updated successfully!')
      window.history.replaceState({}, '', `/dashboard/${accountId}/billing`)
    } else if (canceled === 'true') {
      setError('Checkout was canceled. You can try again when ready.')
      window.history.replaceState({}, '', `/dashboard/${accountId}/billing`)
    } else if (upgradePlan && plansData && !loading && !autoUpgradeTriggered) {
      const targetPlan = plansData.plans.find(p => p.name === upgradePlan)
      if (targetPlan?.stripePriceId) {
        setAutoUpgradeTriggered(true)
        window.history.replaceState({}, '', `/dashboard/${accountId}/billing`)
        createCheckout.mutate(targetPlan.id)
      }
    }
  }, [searchParams, accountId, plansData, loading, autoUpgradeTriggered, createCheckout])

  const handleUpgrade = useCallback((planId: string) => {
    setError(null)
    createCheckout.mutate(planId)
  }, [createCheckout])

  const handleManageSubscription = useCallback(() => {
    setError(null)
    createPortal.mutate()
  }, [createPortal])

  if (loading) {
    return <PageSkeleton />
  }

  const subscription = subscriptionData?.subscription
  const plan = subscriptionData?.plan
  const isFreeTier = subscriptionData?.isFreeTier ?? true
  const usage = usageData?.usage
  const limits = usageData?.limits
  const plans = plansData?.plans ?? []

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Billing</h1>
        <p className="text-neutral-500 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive/80"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">
                {plan?.displayName ?? 'Free'}
              </h3>
              {subscription && (
                <p className="text-sm text-neutral-500 mt-1">
                  {subscription.status === 'active' ? 'Active' : subscription.status}
                  {subscription.currentPeriodEnd && (
                    <> - Renews {formatDate(subscription.currentPeriodEnd)}</>
                  )}
                </p>
              )}
              {isFreeTier && (
                <p className="text-sm text-neutral-500 mt-1">
                  Free tier - upgrade for more features
                </p>
              )}
            </div>
            {isFreeTier ? (
              <Button
                onClick={() => {
                  const proPlan = plans.find(p => p.name === 'pro')
                  if (proPlan) handleUpgrade(proPlan.id)
                }}
                disabled={createCheckout.isPending || plans.length === 0}
              >
                {createCheckout.isPending ? 'Loading...' : 'Upgrade'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={createPortal.isPending}
              >
                {createPortal.isPending ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
          </div>

          <Separator />

          {/* Plan Features */}
          {plan && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-neutral-500">MAU Limit</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {plan.limits.monthlyActiveUsers
                    ? plan.limits.monthlyActiveUsers.toLocaleString()
                    : 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Apps</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {plan.limits.apps ?? 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Storage</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {plan.limits.storage ? `${String(plan.limits.storage)} GB` : 'Unlimited'}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Team Members</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {plan.limits.teamMembers ?? 'Unlimited'}
                </div>
              </div>
            </div>
          )}

          {/* Features List */}
          {plan?.features && plan.features.length > 0 && (
            <div>
              <div className="text-sm text-neutral-500 mb-2">Included Features</div>
              <div className="flex flex-wrap gap-2">
                {plan.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage This Month */}
      {usage && limits && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <UsageStat
                label="Monthly Active Users"
                value={usage.monthlyActiveUsers}
                limit={limits.monthlyActiveUsers}
              />
              <UsageStat
                label="Apps"
                value={usage.apps}
                limit={limits.apps}
              />
              <UsageStat
                label="Storage"
                value={Math.round(usage.storageUsedMb)}
                limit={limits.storage ? limits.storage * 1024 : null}
                suffix="MB"
              />
              <UsageStat
                label="API Calls"
                value={usage.apiCalls}
                limit={limits.apiCalls}
                format="compact"
              />
            </div>

            <Separator className="my-6" />

            {/* Period Info */}
            <div className="text-sm text-neutral-500">
              Current period: {formatDate(usage.periodStart)} - {formatDate(usage.periodEnd)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {isFreeTier && plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'border p-4',
                    p.name === plan?.name
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200'
                  )}
                >
                  <h3 className="font-semibold text-neutral-900">{p.displayName}</h3>
                  <p className="text-2xl font-semibold text-neutral-900 mt-2">
                    ${String(p.priceCents / 100)}
                    <span className="text-sm font-normal text-neutral-500">/mo</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                    <li>
                      {p.limits.monthlyActiveUsers
                        ? `${p.limits.monthlyActiveUsers.toLocaleString()} MAU`
                        : 'Unlimited MAU'}
                    </li>
                    <li>
                      {p.limits.apps ? `${String(p.limits.apps)} apps` : 'Unlimited apps'}
                    </li>
                    <li>
                      {p.limits.storage ? `${String(p.limits.storage)} GB storage` : 'Unlimited storage'}
                    </li>
                    <li>
                      {p.limits.teamMembers
                        ? `${String(p.limits.teamMembers)} team members`
                        : 'Unlimited team'}
                    </li>
                  </ul>
                  <Button
                    className="w-full mt-4"
                    variant={p.name === plan?.name ? 'outline' : 'default'}
                    disabled={p.name === plan?.name || createCheckout.isPending || !p.stripePriceId}
                    onClick={() => handleUpgrade(p.id)}
                  >
                    {p.name === plan?.name
                      ? 'Current Plan'
                      : createCheckout.isPending
                        ? 'Loading...'
                        : !p.stripePriceId
                          ? 'Contact Sales'
                          : 'Upgrade'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout Error */}
      {createCheckout.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3">
          {createCheckout.error instanceof Error
            ? createCheckout.error.message
            : 'Failed to create checkout session'}
        </div>
      )}
    </div>
  )
}
