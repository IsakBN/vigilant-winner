# Billing System Extractor

You are extracting COMPLETE billing/subscription system knowledge from codepush.

## Target Files

Read EVERY file in these locations:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/subscriptions/` (ALL files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/billing.ts` (if exists)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/app/**/billing/**`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/lib/api/billing.ts`
- Any file with "stripe", "subscription", "plan", "billing", "checkout", "portal" in the name

## What to Extract

### 1. Subscription Plans
- All plan tiers (Free, Pro, Team, Enterprise)
- Pricing for each tier
- Features/limits per tier:
  - MAU limits
  - Storage limits
  - Concurrent builds
  - Team members
  - Retention days
- How plans are stored in database

### 2. Stripe Integration
- Stripe API client setup
- How API keys are used
- Webhook signature verification
- Error handling

### 3. Checkout Flow
- How checkout sessions are created
- Stripe checkout parameters
- Success/cancel URLs
- Metadata passed to Stripe
- How user is linked to subscription

### 4. Webhook Handlers
Document EVERY webhook event handled:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- Any others

For each:
- What data is received
- What database updates happen
- Error handling

### 5. Billing Portal
- How portal sessions are created
- What users can do in portal
- Return URL handling

### 6. Usage Tracking
- How MAU is counted
- How storage is tracked
- How build usage is tracked
- Usage notification thresholds
- Overage handling

### 7. User Limit Overrides
- How admins can override limits
- Override types (multiplier vs absolute)
- Override expiration
- Database schema

### 8. Database Tables
Full schema for:
- `subscription_plans`
- `subscriptions`
- `build_usage`
- `usage_notifications`
- `user_limit_overrides`

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/billing.md`

```markdown
# Billing System

## Overview
[2-3 sentence summary]

## Subscription Plans

### Plan Tiers
| Plan | Price | MAU Limit | Storage | Builds | Teams |
|------|-------|-----------|---------|--------|-------|
| Free | $0 | 1,000 | 1GB | 1 concurrent | No |
| Pro | $19.99/mo | 10,000 | 10GB | 2 concurrent | No |
| Team | $99.99/mo | 50,000 | 50GB | 5 concurrent | Yes |
| Enterprise | Custom | Unlimited | Unlimited | 10 concurrent | Yes |

### Feature Matrix
[Detailed feature comparison]

### Plan Database Schema
[Full schema]

## Stripe Integration

### Configuration
[How Stripe is configured]

### API Client
[Code showing Stripe request helper]

### Webhook Verification
[Full verification code]

## Checkout Flow

### Creating Checkout Session
[Full endpoint code]

### Stripe Parameters
| Parameter | Value | Purpose |
|-----------|-------|---------|
| mode | subscription | ... |
| client_reference_id | userId | ... |

### Success Handling
[What happens after successful checkout]

## Webhook Handlers

### checkout.session.completed
[Full handler code and logic]

### customer.subscription.updated
[Full handler code and logic]

### customer.subscription.deleted
[Full handler code and logic]

### invoice.payment_failed
[Full handler code and logic]

## Billing Portal

### Creating Portal Session
[Full endpoint code]

### User Capabilities
[What users can manage]

## Usage Tracking

### MAU Counting
[How MAU is calculated]

### Storage Tracking
[How storage is measured]

### Build Usage
[How builds are counted]

### Overage Notifications
[When and how users are notified]

## Admin Overrides

### Override Types
[Multiplier vs absolute]

### Creating Overrides
[Admin endpoint and logic]

### Override Schema
[Database table]

## Database Schema

### subscription_plans
[Full schema with all columns]

### subscriptions
[Full schema with all columns]

### build_usage
[Full schema with all columns]

### usage_notifications
[Full schema with all columns]

### user_limit_overrides
[Full schema with all columns]

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| STRIPE_SECRET_KEY | Yes | API access |
| STRIPE_WEBHOOK_SECRET | Yes | Webhook verification |
| STRIPE_PUBLISHABLE_KEY | Yes | Frontend checkout |

## Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| invalid_signature | Bad webhook sig | 400 |
| subscription_not_found | ... | 404 |

## Integration Points
- [How billing connects to auth]
- [How billing connects to usage limits]
- [How billing connects to team features]
```

## Rules

- Read EVERY file completely
- Extract exact Stripe event types handled
- Document ALL plan limits precisely
- Include actual code for webhook handlers
- Note the relationship between Stripe and database
