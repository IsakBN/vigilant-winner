# Dashboard Extractor

You are extracting COMPLETE dashboard/frontend knowledge from codepush.

## Target Files

Read EVERY file in these locations:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/app/` (ALL route files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/components/` (key components)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/lib/` (ALL files)
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/hooks/` (ALL files)
- `next.config.js`, `tailwind.config.ts`, `package.json`

## What to Extract

### 1. Route Structure
Map EVERY route in the app:
- Public routes (landing, login, signup)
- Protected routes (dashboard/*)
- Admin routes (admin/*)
- API routes (if any in Next.js)
- Route groups and layouts

### 2. Authentication Flow
- Sign in page
- Sign up page
- OAuth buttons
- Session handling
- Protected route wrapper
- Redirect logic

### 3. API Client
- Base URL configuration
- Fetch wrapper
- Auth header injection
- Error handling
- All API functions

### 4. Key Pages

#### App Management
- App list page
- App detail page
- App settings page
- Create app flow

#### Release Management
- Release list page
- Release detail page
- Upload release flow
- Rollback UI

#### Device/Audience
- Device list page
- Filtering options
- Device details

#### Billing
- Plan selection
- Checkout flow
- Billing portal link
- Usage display

#### Team Management
- Team list
- Team creation
- Member management
- Invitation UI
- Join team page

### 5. Components
Key reusable components:
- Layout components
- Navigation
- Forms
- Tables
- Charts/Stats
- Modals

### 6. State Management
- TanStack Query usage
- Query keys
- Mutations
- Optimistic updates
- Cache invalidation

### 7. Form Handling
- React Hook Form usage
- Zod validation
- Form components

## Output Format

Write to: `/Users/isaks_macbook/Desktop/Dev/bundlenudge/.claude/extraction/output/dashboard.md`

```markdown
# Dashboard (Frontend)

## Overview
[2-3 sentence summary]

## Technology Stack
- Framework: Next.js 15 (App Router)
- React: 19
- Styling: Tailwind CSS
- State: TanStack Query
- Forms: React Hook Form + Zod
- UI Components: shadcn/ui

## Route Structure

### Public Routes
| Path | Page | Purpose |
|------|------|---------|
| / | Landing | Marketing page |
| /sign-in | Login | User authentication |
| /sign-up | Register | New user signup |
| /teams/join | Join Team | OTP verification |

### Protected Routes (require auth)
| Path | Page | Purpose |
|------|------|---------|
| /dashboard/[accountId] | Dashboard | Main dashboard |
| /dashboard/[accountId]/apps | App List | List user's apps |
| /dashboard/[accountId]/apps/[id] | App Detail | App overview |
| /dashboard/[accountId]/apps/[id]/releases | Releases | Release management |
| /dashboard/[accountId]/apps/[id]/devices | Devices | Audience view |
| /dashboard/[accountId]/apps/[id]/settings | Settings | App settings |
| /dashboard/[accountId]/billing | Billing | Subscription management |
| /dashboard/[accountId]/teams | Teams | Team management |
| /dashboard/[accountId]/settings | Settings | User settings |

### Admin Routes (require @bundlenudge.com)
| Path | Page | Purpose |
|------|------|---------|
| /admin | Admin Dashboard | Admin overview |
| /admin/users | User Management | Manage users |
| /admin/subscriptions | Subscriptions | Manage subs |
| /admin/apps | All Apps | System-wide apps |

### Route Groups
- `(main)` - Protected dashboard routes
- `(auth)` - Public auth routes
- `(admin-public)` - Admin login (public)

## Authentication Flow

### Sign In Page
[Components and flow]

### Sign Up Page
[Components and flow]

### OAuth Integration
[How GitHub OAuth is triggered]

### Session Handling
[How sessions are checked/refreshed]

### Protected Route Wrapper
[Code showing auth check]

## API Client

### Configuration
```typescript
// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL
```

### Fetch Wrapper
[Full implementation]

### Auth Header
[How token is attached]

### API Functions

#### Apps
- getApps(): Promise<App[]>
- getApp(id): Promise<App>
- createApp(data): Promise<App>
- updateApp(id, data): Promise<App>
- deleteApp(id): Promise<void>

#### Releases
- getReleases(appId): Promise<Release[]>
- createRelease(formData): Promise<Release>
- rollbackRelease(id, reason): Promise<void>

#### Teams
[All team API functions]

#### Billing
[All billing API functions]

## Key Pages

### App List (/dashboard/[accountId]/apps)
- Components used: [list]
- Data fetching: [query key, fetch function]
- Actions: [create, delete]

### App Detail (/dashboard/[accountId]/apps/[id])
- Components used: [list]
- Tabs/sections: [overview, releases, devices, settings]
- Data fetching: [queries]

### Release Management
- Upload flow: [step by step]
- Rollback UI: [how it works]
- Targeting rules editor: [component]

### Billing Page
- Plan display: [current plan]
- Upgrade flow: [Stripe checkout redirect]
- Usage display: [charts/stats]
- Portal link: [how it opens]

### Team Management
- Team list: [display]
- Create team: [modal/flow]
- Member list: [table]
- Invite flow: [form, email input]
- Role management: [dropdown]

## Components

### Layout
- DashboardLayout: [structure]
- Sidebar: [navigation items]
- Header: [user menu, notifications]

### Data Display
- DataTable: [features]
- StatsCard: [usage]
- Chart components: [which library]

### Forms
- Form wrapper: [RHF integration]
- Input components: [list]
- Validation display: [error messages]

### Modals
- Dialog component: [usage]
- Confirmation modal: [delete, rollback]

## State Management

### TanStack Query Setup
[QueryClient configuration]

### Query Keys
| Key | Purpose |
|-----|---------|
| ['apps'] | App list |
| ['apps', id] | Single app |
| ['releases', appId] | Releases for app |
| ['teams'] | Team list |
| ['subscription'] | User subscription |

### Mutations
[Key mutations with invalidation]

## Form Handling

### React Hook Form
[Configuration and usage]

### Zod Schemas
[Where schemas are defined]

### Form Components
[Reusable form components]

## Environment Variables

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_API_URL | API base URL |
| NEXT_PUBLIC_STRIPE_KEY | Stripe publishable |

## Styling

### Tailwind Config
[Key customizations]

### Theme
[Colors, fonts]

### shadcn/ui Components
[Which ones are used]
```

## Rules

- Map EVERY route in the app
- Document ALL API client functions
- Note all TanStack Query keys
- Include component hierarchy for key pages
- Document the complete auth flow
