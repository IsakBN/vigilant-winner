# Integrations Extractor

You are extracting COMPLETE external integrations knowledge from codepush.

## Target Files

Read EVERY file in these locations:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/webhooks/` (ALL files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/integrations.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/github-app.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/github-app.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/integrations/` (ALL files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/email.ts`
- Any file with "webhook", "slack", "discord", "sentry", "email", "resend" in the name

## What to Extract

### 1. Outgoing Webhooks (Slack/Discord/Custom)
- Webhook CRUD endpoints
- Supported webhook types
- Event types that trigger webhooks:
  - build.started
  - build.completed
  - build.failed
  - release.deployed
  - release.rollback
  - etc.
- Payload format for each event
- Slack formatting
- Discord formatting
- Custom HTTP formatting
- Webhook testing endpoint
- Webhook event logging
- Retry logic (if any)

### 2. Crash Reporting Integrations
- Sentry integration
- Bugsnag integration (if exists)
- Firebase Crashlytics (if exists)
- How credentials are stored (encrypted)
- How crash data is synced
- Integration CRUD endpoints

### 3. GitHub App Integration
- GitHub App installation flow
- Webhook handling for GitHub events
- Repository access
- Commit tracking
- Installation token generation
- Database schema for installations

### 4. Email System (Resend)
- Resend configuration
- Email types sent:
  - Team invitations
  - OTP codes
  - Usage alerts
  - etc.
- Email templates/format
- Error handling

### 5. Database Tables
Full schema for:
- `webhooks`
- `webhook_events`
- `crash_integrations`
- `github_installations`

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/integrations.md`

```markdown
# External Integrations

## Overview
[2-3 sentence summary]

## Outgoing Webhooks

### Database Schema

#### webhooks
[Full schema]

#### webhook_events
[Full schema]

### Supported Types
- Slack
- Discord
- Custom HTTP

### CRUD Endpoints

#### Create Webhook
- Endpoint: POST /api/webhooks/:appId
- Request: { type, url, events[], secret? }
- [Full details]

#### List Webhooks
[Full details]

#### Update Webhook
[Full details]

#### Delete Webhook
[Full details]

#### Test Webhook
[Full details]

### Event Types

| Event | When Triggered | Payload |
|-------|----------------|---------|
| build.started | Build begins | { buildId, appId, version, ... } |
| build.completed | Build succeeds | { buildId, appId, version, duration, ... } |
| build.failed | Build fails | { buildId, appId, error, ... } |
| release.deployed | Release activated | { releaseId, version, ... } |
| release.rollback | Rollback triggered | { releaseId, fromVersion, toVersion, reason } |

### Payload Formatting

#### Slack Format
[Actual Slack payload structure with blocks]

#### Discord Format
[Actual Discord embed structure]

#### Custom HTTP Format
[Raw JSON payload]

### Webhook Delivery
- HTTP method: POST
- Headers: [Content-Type, X-Signature, etc.]
- Signature calculation: [HMAC details]
- Timeout: [value]
- Retry policy: [if any]

### Event Logging
[How webhook deliveries are logged]

## Crash Reporting Integrations

### Database Schema
[Full schema for crash_integrations]

### Supported Providers
- Sentry
- Bugsnag (if exists)
- Firebase Crashlytics (if exists)

### CRUD Endpoints
[All endpoints]

### Credential Storage
- Encryption: AES-256-GCM
- Key: ENCRYPTION_KEY env var
[Code showing encryption/decryption]

### Data Sync
[How crash data flows between systems]

## GitHub App

### Database Schema
[Full schema for github_installations]

### Installation Flow
1. User clicks "Install GitHub App"
2. [Step by step]

### Webhook Events Handled
| Event | Handler | Purpose |
|-------|---------|---------|
| installation | ... | Track installations |
| push | ... | Detect commits |

### Installation Tokens
[How tokens are generated for API access]

### Repository Access
[What scopes/permissions]

## Email System (Resend)

### Configuration
[How Resend is set up]

### Email Types

#### Team Invitation
- When: User invited to team
- To: Invitee email
- Subject: [exact subject]
- Body: [template/format]

#### OTP Code
- When: Admin login
- [Details]

#### Usage Alert
- When: Approaching limit
- [Details]

### Sending Function
[Actual email sending code]

### Error Handling
[How email failures are handled]

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| RESEND_API_KEY | Yes | Email sending |
| EMAIL_FROM | Yes | From address |
| ENCRYPTION_KEY | Yes | Credential encryption |
| GITHUB_APP_ID | Yes | GitHub App |
| GITHUB_APP_PRIVATE_KEY | Yes | GitHub App signing |

## Error Handling

| Error | HTTP | When |
|-------|------|------|
| webhook_not_found | 404 | Invalid webhookId |
| invalid_webhook_type | 400 | Unknown type |
| email_send_failed | 500 | Resend error |

## Integration Points
- [Webhooks triggered by builds]
- [Webhooks triggered by releases]
- [GitHub linked to builds]
- [Email linked to teams]
```

## Rules

- Read EVERY file in webhooks/ and integrations/
- Document ALL webhook event types
- Include actual payload formats
- Show encryption code for credentials
- Document the complete GitHub App flow
