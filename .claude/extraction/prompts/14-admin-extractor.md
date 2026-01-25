# Admin System Extractor

You are extracting COMPLETE admin panel knowledge from codepush.

## Target Files

Read EVERY file in these locations:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/api/src/routes/admin/` (ALL files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/app/admin/` (ALL files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/app/(admin-public)/` (ALL files)
- Any file with "admin" in the name

## What to Extract

### 1. Admin Authentication
- OTP login flow (not regular auth)
- Domain-based access (`@bundlenudge.com`)
- Admin OTP generation
- Admin OTP verification
- Admin session management
- Database schema for:
  - `admin_otps`
  - `admin_sessions`

### 2. User Management
- List users endpoint (with filtering)
- Search users
- View user details
- Suspend user
- Unsuspend user
- Update user

### 3. Usage Overrides
- Grant extra limits to users
- Override types:
  - Multiplier (2x, 3x, etc.)
  - Absolute (specific number)
- Override expiration
- Override reason tracking
- Who set the override

### 4. Subscription Management
- List all subscriptions
- View subscription details
- Manual plan changes
- Credits system (if exists)

### 5. App Management
- List all apps (system-wide)
- View app details
- App statistics

### 6. Admin Dashboard Stats
- Total users
- Total apps
- Total builds
- Revenue metrics (if tracked)
- System health

### 7. Admin Audit Log
- What admin actions are logged
- Audit log schema
- Audit log viewing

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/admin.md`

```markdown
# Admin System

## Overview
[2-3 sentence summary]

## Admin Authentication

### Domain-Based Access
- Only `@bundlenudge.com` emails can access admin
- Check function: [isAdmin code]

### OTP Login Flow
1. Admin goes to /admin/login
2. Enters email (must be @bundlenudge.com)
3. System generates 6-digit OTP
4. OTP hashed and stored in admin_otps
5. Email sent via Resend
6. Admin enters OTP
7. OTP verified, admin_session created
8. Session cookie set

### Database Schema

#### admin_otps
| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT | Primary key |
| email | TEXT | Admin email |
| otp_hash | TEXT | Bcrypt hash |
| expires_at | INTEGER | Expiration time |
| used | INTEGER | 0 or 1 |

#### admin_sessions
| Column | Type | Purpose |
|--------|------|---------|
| id | TEXT | Session ID |
| email | TEXT | Admin email |
| created_at | INTEGER | Creation time |
| expires_at | INTEGER | Expiration |
| ip_address | TEXT | Login IP |
| user_agent | TEXT | Browser |

### Endpoints

#### Request OTP
- POST /admin/auth/request-otp
- Request: { email }
- Logic: [Full logic]

#### Verify OTP
- POST /admin/auth/verify-otp
- Request: { email, otp }
- Logic: [Full logic]

#### Logout
- POST /admin/auth/logout
- Logic: [Delete session]

## User Management

### List Users
- GET /api/admin/users
- Query params:
  - search: string
  - plan: string
  - hasOverrides: boolean
  - suspended: boolean
  - page: number
  - limit: number
- Response: { users[], total, page }

### View User
- GET /api/admin/users/:userId
- Response: [Full user details with subscription, usage, overrides]

### Suspend User
- POST /api/admin/users/:userId/suspend
- Request: { reason, permanent: boolean }
- Logic: [What happens when suspended]

### Unsuspend User
- POST /api/admin/users/:userId/unsuspend
- Logic: [How to restore access]

## Usage Overrides

### Database Schema
[Full schema for user_limit_overrides]

### Override Types
| Type | Example | Purpose |
|------|---------|---------|
| multiplier | 2.0 | Double the limits |
| absolute | 100000 | Set specific MAU |

### Create Override
- POST /api/admin/users/:userId/override
- Request: { type, value, expiresAt?, reason }
- Logic: [Full logic]

### Override Fields
| Field | Purpose |
|-------|---------|
| user_id | Target user |
| limit_type | Which limit (mau, storage, builds) |
| override_type | multiplier or absolute |
| value | The override value |
| expires_at | When override ends (null = permanent) |
| created_by | Admin who created |
| reason | Why override was granted |
| created_at | When created |

## Subscription Management

### List Subscriptions
- GET /api/admin/subscriptions
- Filters: [available filters]
- Response: [Full response shape]

### Grant Credits
- POST /api/admin/users/:userId/credits
- Request: { amount, reason }
- [If this exists]

## App Management

### List All Apps
- GET /api/admin/apps
- [Details]

## Dashboard Stats

### Stats Endpoint
- GET /api/admin/stats
- Response:
  - totalUsers
  - totalApps
  - totalBuilds
  - activeSubscriptions
  - mrr (monthly recurring revenue?)
  - [Other metrics]

## Admin Audit Log

### What's Logged
| Action | When |
|--------|------|
| user.suspended | Admin suspends user |
| user.unsuspended | Admin unsuspends |
| override.created | Limit override added |
| override.removed | Override deleted |
| [etc] | |

### Viewing Audit Log
- GET /api/admin/audit-log
- [Details]

## Dashboard Pages

### /admin (Main)
- [What's shown]

### /admin/users
- [User management UI]

### /admin/subscriptions
- [Subscription management UI]

### /admin/apps
- [App listing UI]

## Environment Variables

| Variable | Purpose |
|----------|---------|
| ADMIN_DOMAINS | Allowed email domains |

## Security Considerations
- [Rate limiting on OTP]
- [Session expiration]
- [Audit logging]
- [IP tracking]
```

## Rules

- Read EVERY admin file completely
- Document the COMPLETE OTP flow
- Include all user management capabilities
- Document override system thoroughly
- Note what gets audit logged
