# BundleNudge Codebase Deep Dive

*Generated from codebase investigation on 2026-01-25*

---

## Table of Contents

1. [Dashboard Component Structure](#1-dashboard-component-structure)
2. [SDK Internal Architecture](#2-sdk-internal-architecture)
3. [Test Coverage](#3-test-coverage)

---

# 1. Dashboard Component Structure

## 1.1 Component Tree

### `/src/components/admin/` - Admin Dashboard Components

| File | Purpose | Props Interface | Used By |
|------|---------|-----------------|---------|
| `ActivityFeed.tsx` | Display admin activity/audit log | `{ entries: ActivityEntry[] }` | Admin page |
| `AppDetailModal.tsx` | Modal for viewing app details | `{ app: App, open: boolean, onClose: () => void }` | Admin apps tab |
| `AuditLogDetailModal.tsx` | Modal for audit log entry details | `{ entry: AuditEntry, open: boolean }` | Admin audit tab |
| `DataTab.tsx` | Tab for raw data display | `{ data: unknown }` | Admin page |
| `HealthIndicator.tsx` | Status indicator (green/yellow/red) | `{ status: 'healthy' \| 'warning' \| 'critical' }` | Multiple admin views |
| `QueueCard.tsx` | Display queue statistics | `{ queue: QueueStats }` | Admin overview |
| `SnapshotHeader.tsx` | Header for admin snapshot view | `{ title: string, timestamp: Date }` | Admin page |
| `Sparkline.tsx` | Small inline chart | `{ data: number[], color?: string }` | StatCard, QueueCard |
| `StatCard.tsx` | Metric display card | `{ title: string, value: number, change?: number }` | Admin overview |
| `SubscriptionDetailModal.tsx` | Modal for subscription details | `{ subscription: Subscription, open: boolean }` | Admin subscriptions tab |
| `UserDetailModal.tsx` | Modal for user details | `{ user: User, open: boolean }` | Admin users tab |

#### `/src/components/admin/tabs/` - Admin Tab Components

| File | Purpose |
|------|---------|
| `AppsTab.tsx` | Table of all apps with search/filter |
| `AuditLogTab.tsx` | Paginated audit log table |
| `BuildsTab.tsx` | Build queue management |
| `OverviewTab.tsx` | System health overview dashboard |
| `ReleasesTab.tsx` | All releases across apps |
| `SubscriptionsTab.tsx` | Subscription/billing management |
| `UsersTab.tsx` | User management table |

### `/src/components/dashboard/` - Main Dashboard Components

| File | Purpose | Props Interface | Used By |
|------|---------|-----------------|---------|
| `AlertBanner.tsx` | Warning/info banner | `{ type: 'warning' \| 'info' \| 'error', message: string }` | Multiple pages |
| `AppCard.tsx` | App summary card | `{ app: App, onClick?: () => void }` | Dashboard home |
| `AppHealthTable.tsx` | Table showing app health metrics | `{ apps: App[] }` | Dashboard overview |
| `DashboardShell.tsx` | Main layout wrapper | `{ children: ReactNode }` | All dashboard pages |
| `HealthCheckStats.tsx` | Health check statistics display | `{ stats: HealthCheckStats }` | App detail page |
| `HealthIndicator.tsx` | Visual health status dot | `{ status: 'healthy' \| 'degraded' \| 'critical' }` | AppCard, tables |
| `OnboardingChecklist.tsx` | Setup progress checklist | `{ completedSteps: string[] }` | New user flow |
| `ReleaseMetrics.tsx` | Release statistics chart | `{ metrics: { check, download, applied, rollback } }` | Release detail |
| `RolloutSlider.tsx` | Rollout percentage slider | `{ value: number, onChange: (v: number) => void, disabled?: boolean }` | Release detail |
| `Sidebar.tsx` | Navigation sidebar | `{ currentPath: string }` | DashboardShell |
| `Sparkline.tsx` | Mini inline chart | `{ data: number[], width?: number, height?: number }` | StatCard |
| `StatCard.tsx` | Metric card with optional trend | `{ title: string, value: string \| number, trend?: number }` | Dashboard pages |
| `UpdateFunnel.tsx` | Update flow funnel chart | `{ data: FunnelData }` | Release detail |
| `UploadJobCard.tsx` | Upload job status card | `{ job: UploadJob }` | Uploads page |
| `UploadJobsList.tsx` | List of upload jobs | `{ jobs: UploadJob[] }` | Uploads page |
| `UsageDisplay.tsx` | MAU/storage usage bars | `{ usage: UsageInfo, limits: PlanLimits }` | Billing, settings |
| `VersionDistribution.tsx` | Version distribution chart | `{ distribution: VersionData[] }` | App detail |

### `/src/components/ui/` - Shared UI Components (shadcn/ui)

| Component | Based On |
|-----------|----------|
| `alert-dialog.tsx` | Radix AlertDialog |
| `badge.tsx` | Custom badge component |
| `button.tsx` | Radix Slot + custom variants |
| `card.tsx` | Custom card component |
| `dialog.tsx` | Radix Dialog |
| `input.tsx` | HTML input with styling |
| `label.tsx` | Radix Label |
| `radio-group.tsx` | Radix RadioGroup |
| `select.tsx` | Radix Select |
| `separator.tsx` | Radix Separator |
| `skeleton.tsx` | Loading skeleton |
| `slider.tsx` | Radix Slider |
| `switch.tsx` | Radix Switch |
| `table.tsx` | HTML table with styling |
| `tabs.tsx` | Radix Tabs |
| `textarea.tsx` | HTML textarea with styling |
| `toast.tsx` | Radix Toast |

---

## 1.2 Page Structure

### Route: `/dashboard/[accountId]`
- **Main Components:** `DashboardShell`, `Sidebar`, `AppCard`, `UsageDisplay`
- **Data Fetching:**
  - `['apps']` - App list
  - `['dashboard-overview']` - Usage stats

### Route: `/dashboard/[accountId]/apps/[id]`
- **Main Components:** App overview, `StatCard`, `VersionDistribution`
- **Data Fetching:**
  - `['apps', appId]` - App details
  - `['releases', appId]` - Releases list

### Route: `/dashboard/[accountId]/apps/[id]/releases/[releaseId]`
- **Main Components:** `ReleaseMetrics`, `UpdateFunnel`, `RolloutSlider`
- **Data Fetching:**
  - `['release', appId, releaseId]` - Release detail with stats

### Route: `/dashboard/[accountId]/billing`
- **Main Components:** `UsageDisplay`, plan cards, billing history
- **Data Fetching:**
  - `['subscription']` - Current subscription
  - `['plans']` - Available plans

### Route: `/dashboard/[accountId]/teams`
- **Main Components:** Team members table, invite modal
- **Data Fetching:**
  - `['teams']` - User's teams
  - `['team-members', teamId]` - Members list

### Route: `/admin`
- **Main Components:** Admin tabs (Overview, Apps, Users, etc.)
- **Data Fetching:**
  - `['admin-stats']` - System statistics
  - `['admin-apps']` - All apps
  - `['admin-users']` - All users

---

## 1.3 State Management

### TanStack Query Keys

| Key Pattern | Description | Stale Time |
|-------------|-------------|------------|
| `['apps']` | User's app list | 5 min |
| `['apps', appId]` | Single app details | 5 min |
| `['releases', appId]` | App's releases | 30 sec |
| `['release', appId, releaseId]` | Release detail + stats | 15 sec |
| `['subscription']` | User subscription | 5 min |
| `['plans']` | Available plans | 30 min |
| `['teams']` | User's teams | 5 min |
| `['team-members', teamId]` | Team members | 5 min |
| `['team-invitations', teamId]` | Pending invites | 5 min |
| `['admin-*']` | Admin data (various) | 30 sec - 5 min |

### Mutations with Invalidation Logic

```typescript
// useCreateApp
useMutation({
    mutationFn: (data) => api.apps.create(data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
})

// useUpdateRollout
useMutation({
    mutationFn: ({ releaseId, percentage }) => api.releases.updateRollout(appId, releaseId, percentage),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['release', appId, releaseId] })
        queryClient.invalidateQueries({ queryKey: ['releases', appId] })
    },
})

// useInviteTeamMember
useMutation({
    mutationFn: (data) => api.teams.inviteMember(teamId, data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] })
    },
})
```

### React Context Providers

```typescript
<AuthProvider>              // Better-Auth session management
  <QueryClientProvider>     // TanStack Query
    <ErrorBoundary>         // Error boundary
      <ToastProvider>       // Toast notifications
        <AlertDialogProvider>  // Confirm dialogs
          {children}
        </AlertDialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  </QueryClientProvider>
</AuthProvider>
```

---

## 1.4 API Client

### Base Client

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export class ApiClientError extends Error {
    status: number
    details?: string
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        credentials: 'include',  // Cookie-based auth
    })
    if (!response.ok) {
        const error = await response.json()
        throw new ApiClientError(error.error, response.status, error.details)
    }
    return response.json()
}
```

### API Modules

| Module | Functions |
|--------|-----------|
| `apps` | `list()`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `releases` | `list(appId)`, `get(appId, id)`, `updateRollout(appId, id, pct)`, `disable(appId, id)` |
| `builds` | `list(appId)`, `get(id)`, `trigger(appId, data)`, `cancel(id)`, `getLogs(id)` |
| `credentials` | `list(appId)`, `create(appId, data)`, `delete(appId, id)` |
| `subscriptions` | `getCurrent()`, `getPlans()`, `createCheckout(planId)`, `createPortal()`, `getUsage()` |
| `teams` | `list()`, `get(id)`, `create(data)`, `listMembers(id)`, `inviteMember(id, data)`, `verifyInvite(data)` |
| `devices` | `list(appId)`, `getDetail(appId, id)` |
| `webhooks` | `list(appId)`, `create(appId, data)`, `delete(appId, id)`, `test(appId, id)` |
| `admin` | `getStats()`, `listApps()`, `listUsers()`, `getAuditLog()` |

---

# 2. SDK Internal Architecture

## 2.1 Core Classes

### File Structure

```
packages/sdk/src/
├── bundlenudge.ts    # Main SDK class (singleton)
├── config.ts         # Configuration types & defaults
├── updater.ts        # Update orchestration
├── storage.ts        # Local storage management
├── rollback.ts       # Rollback manager
├── metrics.ts        # Metrics tracking
├── auth.ts           # Device authentication
├── native.ts         # Native bridge
├── health.ts         # Health monitoring
├── hooks.ts          # React hooks
├── logger.ts         # Debug logging
├── parser.ts         # Bundle parsing (delta)
├── patcher.ts        # Patch application
├── integrations.ts   # Crash reporter integrations
└── index.ts          # Public exports
```

### BundleNudge (Main Class)

```typescript
export class BundleNudge {
    private config: CodePushConfig
    private updater: Updater
    private storage: Storage
    private rollbackManager: RollbackManager
    private metricsTracker: MetricsTracker

    // Singleton pattern
    static async initialize(config: BundleNudgeConfig): Promise<BundleNudge>
    static getInstance(): BundleNudge

    // Core update methods
    async checkForUpdate(): Promise<UpdateCheckResponse>
    async downloadAndApply(): Promise<DownloadResult>
    subscribeToProgress(callback: (progress: number) => void): () => void
    async markUpdateSuccessful(): Promise<void>
    async restart(onlyIfUpdateIsPending?: boolean): Promise<boolean>

    // Version management
    async getCurrentVersion(): Promise<string | null>
    async getPendingUpdate(): Promise<{ version: string; bundlePath: string } | null>
    async getDeviceId(): Promise<string>

    // Metrics
    track(name: string, value?: number, metadata?: Record<string, unknown>): void
    async flushMetrics(): Promise<void>
}
```

### Storage

```typescript
export class Storage {
    private basePath: string  // DocumentDirectoryPath/codepush

    // Device ID
    async getOrCreateDeviceId(): Promise<string>

    // Version management
    async getCurrentVersion(): Promise<string | null>
    async getCurrentVersionHash(): Promise<string | null>
    async getPendingUpdate(): Promise<{ version: string; bundlePath: string } | null>
    async setPendingUpdate(version: string): Promise<void>
    async applyPendingUpdate(): Promise<boolean>

    // Bundle storage
    async saveBundle(version: string, data: Uint8Array): Promise<string>
    async saveBundleWithHash(version: string, content: string, hash: string): Promise<string>
    async getBundlePath(version: string): Promise<string | null>

    // Rollback support
    async rollbackToPrevious(): Promise<boolean>
    async commitUpdate(): Promise<boolean>

    // Crash tracking
    async recordCrash(): Promise<number>
    async resetCrashCount(): Promise<void>
    async getCrashCount(): Promise<number>
}
```

### RollbackManager

```typescript
export class RollbackManager {
    private storage: Storage

    static async create(storage: Storage): Promise<RollbackManager>

    async triggerManualRollback(reason?: RollbackReason): Promise<boolean>
    async markSuccess(): Promise<void>
    async recordCrash(): Promise<void>
    async shouldRestart(): Promise<boolean>
    async getBundleToLoad(): Promise<string | null>

    setReportHandler(handler: RollbackReportHandler): void
    async sendPendingRollbackReport(): Promise<boolean>
}
```

---

## 2.2 Initialization Flow

```
BundleNudge.initialize()
    │
    ▼
initializeAsync()
  1. Create Storage instance
  2. Create RollbackManager
  3. Create DeviceAuth with config
  4. Pre-register device
    │
    ▼
Create BundleNudge instance
  1. new Updater(storage, config, authHeaderProvider)
  2. new MetricsTracker(storage, config)
    │
    ▼
Post-initialization
  1. setupRollbackReporting()
  2. runPendingHealthChecks()
  3. if (config.autoUpdate) handleAutoUpdate()
```

---

## 2.3 Error Types/Codes

| Code | Description | When |
|------|-------------|------|
| `NO_PENDING_UPDATE` | No update to download | `downloadAndApply` called without `checkForUpdate` |
| `INVALID_HASH_FORMAT` | Server returned invalid hash | Hash not in `sha256:xxx` format |
| `HASH_MISMATCH` | Downloaded bundle hash differs | Integrity check failed |
| `DOWNLOAD_FAILED` | Network or storage error | Fetch or save failed |
| `PATCH_FAILED` | Delta patch couldn't be applied | Patch application error |

---

# 3. Test Coverage

## 3.1 Coverage by Package

| Package | Test Files | Test Cases | Estimated Coverage |
|---------|------------|------------|-------------------|
| `packages/api` | 47 | ~2145 | ~75-80% |
| `packages/sdk` | 17 | ~639 | ~85-90% |
| `packages/dashboard-v2` | 8 | ~50 | ~30-40% |
| `packages/shared` | 0 | 0 | 0% (types only) |
| `packages/e2e` | 13 | ~200 | N/A (integration) |

## 3.2 Missing Coverage - Critical Paths WITHOUT Tests

### Auth Flows (Partial Coverage)
- [ ] Admin OTP login (NO TESTS)
- [ ] GitHub OAuth callback (NO TESTS)
- [ ] Better-Auth integration flows (NO TESTS)
- [x] Auth middleware (HAS TESTS)
- [x] Device tokens (HAS TESTS)

### Stripe Webhooks (Partial Coverage)
- [ ] Webhook handlers (NO DEDICATED TESTS)
- [x] General subscription tests (HAS TESTS)

### Team Invitations (NO TESTS)
- [ ] Team CRUD (NO TESTS)
- [ ] Invitation flow (NO TESTS)
- [ ] OTP generation and verification (NO TESTS)

### SDK Update Flow (Good Coverage)
- [x] Update orchestration (HAS TESTS)
- [x] Full E2E flow (HAS TESTS)
- [x] Storage operations (HAS TESTS)
- [x] Rollback logic (HAS TESTS)

## 3.3 How to Run Tests

```bash
# API Tests
cd packages/api && pnpm test

# SDK Tests
cd packages/sdk && pnpm test

# Dashboard Tests
cd packages/dashboard-v2 && pnpm test

# E2E Tests
cd packages/e2e && pnpm test
```
