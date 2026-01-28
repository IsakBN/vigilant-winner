# Dashboard Implementation Plan (REVISED)

> **Full Scope:** Landing page + User Dashboard + Admin Dashboard
>
> **Based on Legacy:** 97 components, 26 pages, 9 layouts

---

## Production Quality Standards

**NO SHORTCUTS. NO CHEATING. PRODUCTION-READY CODE.**

- Real API integration (actual fetch calls)
- Real forms with validation + error handling
- Real auth with sessions
- Proper loading/error/empty states
- Accessible (ARIA, keyboard nav)
- Responsive (mobile, tablet, desktop)
- Type-safe (strict TypeScript, no `any`)

---

## Phase 1: Foundation + Landing Page

**Goal:** Project setup, shared components, complete landing page

### 1A: Project Setup
| Task | Description |
|------|-------------|
| Dependencies | Install shadcn/ui, TanStack Query, etc |
| Tailwind config | Theme colors, fonts matching brand |
| TypeScript config | Strict mode, path aliases |
| API client | `src/lib/api/client.ts` - typed fetch wrapper |
| Auth setup | Better Auth client integration |
| Providers | Query provider, auth provider, theme provider |

### 1B: Shared UI Components (shadcn/ui)
Copy/configure from shadcn:
- Button, Input, Label, Textarea
- Card, Dialog, Sheet, Dropdown
- Table, Tabs, Badge, Avatar
- Toast, Tooltip, Skeleton
- Form (react-hook-form integration)

### 1C: Landing Page Components (copy from legacy + adapt)
| Component | Purpose |
|-----------|---------|
| `Navbar` | Top nav with auth-aware buttons |
| `Hero` | Main headline, CTA, demo visual |
| `Comparison` | CodePush vs BundleNudge comparison |
| `HowItWorks` | Step-by-step explanation |
| `Features` | Feature grid/cards |
| `Pricing` | Pricing tiers (Free, Pro, Team, Enterprise) |
| `StagedRollouts` | Rollout feature showcase |
| `VersionControlCenter` | Version management showcase |
| `Testing` | Testing feature showcase |
| `OpenSource` | Open source messaging |
| `Footer` | Links, copyright |

### 1D: Auth Pages
| Page | Route |
|------|-------|
| Login | `/login` |
| Sign Up | `/sign-up` |
| Forgot Password | `/forgot-password` |
| Verify Email | `/verify-email` |

---

## Phase 2: Dashboard Shell + Apps

**Goal:** Main dashboard layout, app management

### 2A: Dashboard Layout
| Component | Purpose |
|-----------|---------|
| `DashboardLayout` | Sidebar + main content area |
| `Sidebar` | Navigation, account switcher |
| `Header` | Breadcrumbs, user menu |
| `AccountSwitcher` | Switch between personal/team accounts |

### 2B: Apps Pages
| Page | Route | Features |
|------|-------|----------|
| Apps List | `/dashboard/[accountId]/apps` | Grid view, search, filters |
| Create App | `/dashboard/[accountId]/apps/new` | Platform select, name, bundle ID |
| App Overview | `/dashboard/[accountId]/apps/[id]` | Stats, quick actions |
| App Settings | `/dashboard/[accountId]/apps/[id]/settings` | Name, API keys, danger zone |
| App Setup | `/dashboard/[accountId]/apps/[id]/setup` | SDK installation guide |

### 2C: App Components
| Component | Purpose |
|-----------|---------|
| `AppCard` | App preview in grid |
| `AppStats` | Downloads, devices, etc |
| `PlatformBadge` | iOS/Android indicator |
| `ApiKeyManager` | View/rotate API keys |
| `SetupInstructions` | SDK install steps |

---

## Phase 3: Releases & Channels

**Goal:** Release management, the core product feature

### 3A: Releases Pages
| Page | Route | Features |
|------|-------|----------|
| Releases List | `/dashboard/[accountId]/apps/[id]/releases` | Table with filters |
| Release Center | `/dashboard/[accountId]/apps/[id]/releases/center` | Active releases dashboard |
| Create Release | `/dashboard/[accountId]/apps/[id]/releases/new` | Upload bundle, set version |
| Release Detail | `/dashboard/[accountId]/apps/[id]/releases/[releaseId]` | Stats, rollout control |

### 3B: Channels
| Feature | Description |
|---------|-------------|
| Channel list | Production, Staging, Beta |
| Channel assignment | Assign release to channel |
| Rollout control | Percentage slider |
| Targeting rules | Device/version targeting |

### 3C: Release Components
| Component | Purpose |
|-----------|---------|
| `ReleaseTable` | Sortable, filterable list |
| `ReleaseCard` | Release summary |
| `ReleaseForm` | Create/edit release |
| `BundleUploader` | Drag-drop bundle upload |
| `RolloutSlider` | Gradual rollout control |
| `ChannelSelector` | Channel dropdown |
| `TargetingRules` | Rule builder UI |
| `ReleaseStats` | Adoption, errors, etc |

---

## Phase 4: Devices & Audience

**Goal:** Device management and targeting

### 4A: Device Pages
| Page | Route | Features |
|------|-------|----------|
| Devices List | `/dashboard/[accountId]/apps/[id]/devices` | Paginated table |
| Device Detail | `/dashboard/[accountId]/apps/[id]/devices/[deviceId]` | Device info |
| Audience | `/dashboard/[accountId]/apps/[id]/audience` | Segments, targeting |

### 4B: Device Components
| Component | Purpose |
|-----------|---------|
| `DeviceTable` | Filterable device list |
| `DeviceCard` | Device summary |
| `DeviceInfo` | Platform, version, etc |
| `AudienceBuilder` | Segment creation |
| `TargetGroupManager` | Manage target groups |

---

## Phase 5: Builds & Uploads

**Goal:** Build management for iOS/Android

### 5A: Build Pages
| Page | Route | Features |
|------|-------|----------|
| Builds List | `/dashboard/[accountId]/apps/[id]/builds` | iOS + Android builds |
| Build Detail | `/dashboard/[accountId]/apps/[id]/builds/[buildId]` | Status, logs |
| Uploads | `/dashboard/[accountId]/apps/[id]/uploads` | Upload history |

### 5B: Build Components
| Component | Purpose |
|-----------|---------|
| `BuildTable` | Build list |
| `BuildCard` | Build summary |
| `BuildLogs` | Log viewer |
| `BuildStatus` | Status badge |
| `UploadProgress` | Upload progress bar |

---

## Phase 6: Teams & Collaboration

**Goal:** Team management

### 6A: Team Pages
| Page | Route | Features |
|------|-------|----------|
| Teams List | `/dashboard/[accountId]/teams` | User's teams |
| Team Detail | `/dashboard/[accountId]/teams/[teamId]` | Overview |
| Team Members | `/dashboard/[accountId]/teams/[teamId]/members` | Member list |
| Invitations | `/dashboard/[accountId]/teams/[teamId]/invitations` | Pending invites |
| Team Settings | `/dashboard/[accountId]/teams/[teamId]/settings` | Config |

### 6B: Team Components
| Component | Purpose |
|-----------|---------|
| `TeamCard` | Team preview |
| `MemberTable` | Members with roles |
| `InviteForm` | Invite by email |
| `RoleSelector` | Role dropdown |
| `PendingInvites` | Invitation list |

---

## Phase 7: Settings & Billing

**Goal:** User settings, billing, integrations

### 7A: Settings Pages
| Page | Route | Features |
|------|-------|----------|
| Profile | `/dashboard/[accountId]/settings` | Name, email, avatar |
| Billing | `/dashboard/[accountId]/settings/billing` | Current plan, invoices |
| Usage | `/dashboard/[accountId]/settings/usage` | MAU, storage |
| Integrations | `/dashboard/[accountId]/settings/integrations` | GitHub, Slack |
| Webhooks | `/dashboard/[accountId]/settings/webhooks` | Webhook management |

### 7B: Billing Components
| Component | Purpose |
|-----------|---------|
| `PlanCard` | Current subscription |
| `PlanSelector` | Upgrade/downgrade |
| `UsageChart` | Usage visualization |
| `InvoiceTable` | Billing history |
| `PaymentMethod` | Card management |

---

## Phase 8: Admin Dashboard

**Goal:** Complete admin system

### 8A: Admin Auth
| Page | Route |
|------|-------|
| Admin Login | `/admin/login` |

### 8B: Admin Pages
| Page | Route | Features |
|------|-------|----------|
| Admin Overview | `/admin` | System metrics |
| Users | `/admin/users` | User management |
| User Detail | `/admin/users/[userId]` | User actions |
| Apps | `/admin/apps` | All apps |
| Subscriptions | `/admin/subscriptions` | All subscriptions |
| Alerts | `/admin/alerts` | System alerts |
| Activity | `/admin/activity` | Activity feed |

### 8C: Admin Components
| Component | Purpose |
|-----------|---------|
| `AdminLayout` | Admin-specific layout |
| `AdminNav` | Admin sidebar |
| `SystemMetrics` | Overview cards |
| `UserTable` | User management |
| `UserActions` | Ban, delete, etc |
| `AlertCard` | System alert |
| `ActivityFeed` | Recent activity |

---

## API Hooks (TanStack Query)

Create hooks for all API endpoints:

```
src/lib/api/hooks/
├── use-apps.ts          # Apps CRUD
├── use-releases.ts      # Releases CRUD
├── use-channels.ts      # Channels CRUD
├── use-devices.ts       # Devices
├── use-builds.ts        # iOS/Android builds
├── use-teams.ts         # Teams CRUD
├── use-members.ts       # Team members
├── use-invitations.ts   # Invitations
├── use-subscriptions.ts # Billing
├── use-metrics.ts       # Analytics
├── use-health.ts        # Health reports
├── use-webhooks.ts      # Webhooks
├── use-integrations.ts  # Integrations
├── use-admin.ts         # Admin endpoints
└── use-auth.ts          # Auth
```

---

## Execution Order

```
Phase 1: Foundation + Landing (MUST BE FIRST)
    │
    ├── 1A: Project setup
    ├── 1B: UI components
    ├── 1C: Landing page
    └── 1D: Auth pages
    │
    ▼ COMMIT

Phase 2: Dashboard Shell + Apps
    │
    ▼ COMMIT

Phase 3: Releases & Channels
    │
    ▼ COMMIT

Phase 4: Devices & Audience
    │
    ▼ COMMIT

Phase 5: Builds & Uploads
    │
    ▼ COMMIT

Phase 6: Teams & Collaboration
    │
    ▼ COMMIT

Phase 7: Settings & Billing
    │
    ▼ COMMIT

Phase 8: Admin Dashboard
    │
    ▼ FINAL COMMIT
```

---

## Quality Gates (Per Phase)

After each phase:
1. ✅ TypeScript compiles (`pnpm typecheck`)
2. ✅ Lint passes (`pnpm lint`)
3. ✅ Pages render without errors
4. ✅ Navigation works
5. ✅ Commit with clear message

---

## File Count Estimate

| Category | Count |
|----------|-------|
| Pages | ~30 |
| Layouts | ~10 |
| Components | ~100 |
| API hooks | ~15 |
| Lib/utils | ~10 |
| **Total files** | **~165** |

---

## Autonomy Rules

While executing, I will:

1. **Work phase by phase** - Complete each before moving on
2. **Reference legacy code** - Copy patterns, adapt for new API
3. **Commit after each phase** - Clear git history
4. **Run checks sequentially** - typecheck → lint (not parallel)
5. **Fix issues immediately** - No accumulating errors
6. **Build for production** - Real functionality, not demos
7. **Handle all states** - Loading, error, empty, success
8. **Use real API** - Connect to @bundlenudge/api endpoints

---

## Legacy Reference

I will reference these legacy paths:
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/components/`
- `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/app/`

Adapting patterns for:
- New API structure (127 routes)
- BundleNudge branding
- Any improvements needed

---

## Approval

This plan covers:
- ✅ Landing page (13 components)
- ✅ User dashboard (all features)
- ✅ Admin dashboard (full system)
- ✅ ~100 components
- ✅ ~30 pages
- ✅ Real API integration
- ✅ Production quality

**Type "approved" to begin execution.**
