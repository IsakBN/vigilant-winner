# Auth System Extractor

You are extracting COMPLETE authentication system knowledge from codepush.

## Target Files

Read EVERY file in these locations:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/auth.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/lib/auth-schema.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/auth.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/github-oauth.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/middleware/auth.ts`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/lib/auth-client.ts`
- Any file with "auth", "oauth", "session" in the name

## What to Extract

### 1. Better Auth Configuration
- How is Better Auth initialized?
- What plugins are used?
- Session configuration (expiration, refresh)
- Database connection (Neon Postgres)
- Cookie settings (domain, secure, sameSite)

### 2. GitHub OAuth Flow
- OAuth initiation endpoint
- Callback handling
- Token encryption/storage
- CSRF protection (state parameter)
- Scopes requested
- Error handling

### 3. Session Management
- Session table schema
- Session validation logic
- Session refresh mechanism
- Cross-subdomain handling
- Cache strategy (KV cache?)

### 4. Middleware Functions
- `requireAuth` - what does it check?
- `requireAdmin` - how is admin determined?
- `optionalAuth` - when is this used?
- Error responses for each

### 5. Admin Authentication
- OTP login flow
- Domain-based access (`@bundlenudge.com`)
- Admin session handling
- Admin OTP table schema

### 6. Dashboard Auth Client
- How does dashboard authenticate?
- Session handling on frontend
- OAuth redirect flow
- Protected route handling

### 7. Environment Variables
- All auth-related env vars
- Which are required vs optional
- Default values

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/auth.md`

```markdown
# Authentication System

## Overview
[2-3 sentence summary]

## Better Auth Configuration

### Initialization
[Code snippet showing exact configuration]

### Plugins Used
- [Plugin 1]: [Purpose]
- [Plugin 2]: [Purpose]

### Session Settings
| Setting | Value | Purpose |
|---------|-------|---------|
| expiration | 7 days | ... |
| refresh | 24 hours | ... |

## GitHub OAuth

### Flow Diagram
[ASCII diagram of the complete flow]

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /auth/github/connect | GET | Initiate OAuth |
| /auth/github/callback | GET | Handle callback |

### Token Storage
[How tokens are encrypted and stored]

### CSRF Protection
[How state parameter works]

## Session Management

### Schema
[Full table schema]

### Validation Logic
[Code snippet]

### Cross-Subdomain
[How cookies work across subdomains]

## Middleware

### requireAuth
[Full implementation with code]

### requireAdmin
[Full implementation with code]

### optionalAuth
[Full implementation with code]

## Admin Authentication

### OTP Flow
1. [Step 1]
2. [Step 2]
...

### Domain Check
[How @bundlenudge.com check works]

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| BETTER_AUTH_SECRET | Yes | - | Session signing |
| GITHUB_CLIENT_ID | Yes | - | OAuth |
| ... | ... | ... | ... |

## Error Codes

| Code | HTTP Status | When |
|------|-------------|------|
| unauthorized | 401 | No valid session |
| forbidden | 403 | Not admin |
| ... | ... | ... |

## Integration Points

- [How auth connects to billing]
- [How auth connects to teams]
- [How auth connects to dashboard]
```

## Rules

- Read EVERY file completely, not just snippets
- Include actual code for complex logic
- Document ALL error cases
- Note any TODOs or FIXMEs found
- Flag anything unclear for follow-up
