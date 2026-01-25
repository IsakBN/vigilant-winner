# Feature: dashboard/billing-pages

Implement billing and subscription pages.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Stripe integration
- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Dashboard components

## Dependencies

- `dashboard/scaffold` (must complete first)
- `dashboard/api-client` (must complete first)
- `api/stripe-billing` (must complete first)

## What to Implement

### 1. Billing Page

```tsx
// app/(dashboard)/dashboard/[accountId]/billing/page.tsx
'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UsageDisplay } from '@/components/dashboard/UsageDisplay'
import { PlanCard } from '@/components/billing/PlanCard'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckIcon } from 'lucide-react'

export default function BillingPage({ params }: { params: { accountId: string } }) {
  const { data: subscriptionData, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.subscriptions.getCurrent(),
  })

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.subscriptions.getPlans(),
    staleTime: 1800000, // 30 minutes
  })

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => api.subscriptions.getUsage(),
  })

  const portalMutation = useMutation({
    mutationFn: () => api.subscriptions.createPortal(),
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => api.subscriptions.createCheckout(planId),
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  const subscription = subscriptionData?.subscription
  const plans = plansData?.plans || []
  const currentPlan = subscription?.planId || 'free'

  if (subLoading || plansLoading) {
    return <BillingPageSkeleton />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-500">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {subscription?.status === 'active' ? (
              <span className="text-green-600">Active</span>
            ) : subscription?.status === 'past_due' ? (
              <span className="text-red-600">Payment due</span>
            ) : (
              <span className="text-gray-500">Free tier</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold capitalize">{currentPlan}</h3>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-gray-500">
                  Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {currentPlan !== 'free' && (
              <Button
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      {usageData && (
        <UsageDisplay usage={usageData.usage} plan={currentPlan} />
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentPlan === plan.id}
              onSelect={() => checkoutMutation.mutate(plan.id)}
              isLoading={checkoutMutation.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BillingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}
```

### 2. Plan Card Component

```tsx
// components/billing/PlanCard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon } from 'lucide-react'
import { Plan } from '@/lib/api'

interface PlanCardProps {
  plan: Plan
  isCurrent: boolean
  onSelect: () => void
  isLoading: boolean
}

export function PlanCard({ plan, isCurrent, onSelect, isLoading }: PlanCardProps) {
  const isPopular = plan.id === 'pro'

  return (
    <Card className={`relative ${isPopular ? 'border-blue-500 border-2' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="capitalize">{plan.name}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
          <span className="text-gray-500">/month</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <CheckIcon className="h-4 w-4 text-green-500" />
            {formatLimit(plan.limits.mau)} MAU
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckIcon className="h-4 w-4 text-green-500" />
            {formatLimit(plan.limits.storage)} storage
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckIcon className="h-4 w-4 text-green-500" />
            {formatLimit(plan.limits.apps)} apps
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckIcon className="h-4 w-4 text-green-500" />
            {formatLimit(plan.limits.teamMembers)} team members
          </li>
          {plan.features.map(feature => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <CheckIcon className="h-4 w-4 text-green-500" />
              {formatFeature(feature)}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrent ? 'outline' : isPopular ? 'default' : 'secondary'}
          disabled={isCurrent || isLoading}
          onClick={onSelect}
        >
          {isCurrent ? 'Current Plan' : isLoading ? 'Loading...' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
        </Button>
      </CardFooter>
    </Card>
  )
}

function formatLimit(value: number): string {
  if (value === Infinity) return 'Unlimited'
  if (value >= 1000000) return `${value / 1000000}M`
  if (value >= 1000) return `${value / 1000}K`
  return String(value)
}

function formatFeature(feature: string): string {
  return feature
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
```

### 3. Checkout Success Handler

```tsx
// app/(dashboard)/dashboard/[accountId]/billing/success/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon } from 'lucide-react'

export default function CheckoutSuccessPage({ params }: { params: { accountId: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    // Invalidate subscription queries to fetch updated data
    queryClient.invalidateQueries({ queryKey: ['subscription'] })
    queryClient.invalidateQueries({ queryKey: ['usage'] })
  }, [queryClient])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle>Subscription Activated!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500">
            Thank you for subscribing. Your new plan is now active and you have access to all the features.
          </p>
          <Button onClick={() => router.push(`/dashboard/${params.accountId}`)}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Files to Create

1. `app/(dashboard)/dashboard/[accountId]/billing/page.tsx`
2. `app/(dashboard)/dashboard/[accountId]/billing/success/page.tsx`
3. `components/billing/PlanCard.tsx`
4. `components/billing/InvoiceHistory.tsx`

## Acceptance Criteria

- [ ] Current plan display
- [ ] Usage meters
- [ ] Plan comparison grid
- [ ] Upgrade/downgrade flow
- [ ] Stripe Checkout redirect
- [ ] Stripe Portal redirect
- [ ] Success page with invalidation
- [ ] Loading states
