# Feature: api/stripe-billing

Implement Stripe subscription billing for BundleNudge.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Section 4: Stripe Integration
- `.claude/knowledge/API_FEATURES.md` → Section: 💳 Subscriptions & Billing

## Dependencies

- `api/better-auth-setup` (requires auth)
- `api/database-schema` (subscription tables)

## What to Implement

### 1. Stripe API Client

Create `packages/api/src/lib/stripe.ts`:

```typescript
export async function stripeRequest(
  secretKey: string,
  endpoint: string,
  method: 'GET' | 'POST',
  params?: Record<string, string>
): Promise<any> {
  const url = `https://api.stripe.com/v1${endpoint}`
  const headers = {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const response = await fetch(url, {
    method,
    headers,
    body: params ? new URLSearchParams(params).toString() : undefined,
  })

  return response.json()
}

export async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Parse: t=timestamp,v1=signature
  const elements = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  const timestamp = elements['t']
  const sig = elements['v1']

  // Verify timestamp within 5 minutes
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) return false

  // HMAC-SHA256
  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))

  // Constant-time compare
  return constantTimeEqual(sig, bufferToHex(expected))
}
```

### 2. Subscription Routes

Create `packages/api/src/routes/subscriptions/index.ts`:

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/plans` | None | List plans |
| GET | `/me` | User | Get user subscription |
| POST | `/checkout` | User | Create checkout session |
| POST | `/portal` | User | Create portal session |
| GET | `/usage` | User | Get usage stats |
| POST | `/webhook` | None | Handle Stripe webhooks |

### 3. Webhook Handler

Create `packages/api/src/routes/subscriptions/webhooks.ts`:

Handle these Stripe events:

```typescript
switch (event.type) {
  case 'checkout.session.completed':
    // Create subscription in DB
    // Link stripe_customer_id and stripe_subscription_id
    break

  case 'customer.subscription.updated':
    // Update status, period_start, period_end
    break

  case 'customer.subscription.deleted':
    // Set status = 'expired'
    break

  case 'invoice.payment_failed':
    // Set status = 'past_due'
    break
}
```

### 4. Checkout Session

```typescript
const params = {
  'mode': 'subscription',
  'line_items[0][price]': plan.stripe_price_id,
  'line_items[0][quantity]': '1',
  'success_url': `${env.DASHBOARD_URL}/settings/billing?success=true`,
  'cancel_url': `${env.DASHBOARD_URL}/settings/billing?canceled=true`,
  'client_reference_id': userId,
  'metadata[plan_id]': plan.id,
}
```

### 5. Subscription Plans

Reference IMPLEMENTATION_DETAILS.md for plan limits:

| Tier | Price | MAU | Storage | Bundle Retention |
|------|-------|-----|---------|------------------|
| Free | $0 | 10,000 | 5 GB | 5 versions |
| Pro | $19.99 | 50,000 | 50 GB | 15 versions |
| Team | $99.99 | 500,000 | 500 GB | 50 versions |
| Enterprise | Custom | Unlimited | Unlimited | 100 versions |

## Environment Variables Required

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DASHBOARD_URL`

## Database Tables

Reference IMPLEMENTATION_DETAILS.md Section 1:
- `subscription_plans`
- `subscriptions`

## Tests Required

1. List plans (public endpoint)
2. Get user subscription
3. Checkout session creation
4. Portal session creation
5. Webhook signature verification
6. Each webhook event handler

## Acceptance Criteria

- [ ] Stripe API client works
- [ ] Plans CRUD (admin only for create)
- [ ] Checkout creates Stripe session
- [ ] Portal creates Stripe session
- [ ] Webhook signature verified
- [ ] All 4 events handled correctly
- [ ] Usage stats calculated
- [ ] All tests pass
