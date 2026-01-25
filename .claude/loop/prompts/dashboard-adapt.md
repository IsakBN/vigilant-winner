## Feature: dashboard/adapt-from-codepush

Adapt the existing codepush dashboard for BundleNudge.

### Reference Implementation

The codepush dashboard is at: `/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard`

### Key Files to Adapt

From codepush, adapt these key components:
- App list and creation UI
- Release list and upload UI
- Release details with stats
- Device list with filtering
- Error/crash dashboard

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS
- **State**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Auth**: Better Auth or Clerk

### Directory Structure

```
packages/dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── apps/
│   │   │   │   ├── page.tsx           # App list
│   │   │   │   ├── [appId]/
│   │   │   │   │   ├── page.tsx       # App overview
│   │   │   │   │   ├── releases/
│   │   │   │   │   │   ├── page.tsx   # Release list
│   │   │   │   │   │   └── [releaseId]/
│   │   │   │   │   │       └── page.tsx # Release details
│   │   │   │   │   ├── devices/
│   │   │   │   │   │   └── page.tsx   # Device list
│   │   │   │   │   ├── targeting/
│   │   │   │   │   │   └── page.tsx   # Targeting rules
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx   # App settings
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── apps/
│   │   ├── releases/
│   │   ├── devices/
│   │   ├── targeting/
│   │   └── ui/                        # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                     # API client
│   │   └── utils.ts
│   └── hooks/
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Key UI Components

#### Release List
```tsx
// components/releases/release-list.tsx
export function ReleaseList({ appId }: { appId: string }) {
  const { data: releases } = useQuery({
    queryKey: ['releases', appId],
    queryFn: () => api.getReleases(appId),
  })

  return (
    <div className="space-y-4">
      {releases?.map((release) => (
        <ReleaseCard key={release.id} release={release} />
      ))}
    </div>
  )
}
```

#### Release Card
```tsx
// components/releases/release-card.tsx
export function ReleaseCard({ release }: { release: Release }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle>{release.version}</CardTitle>
            <CardDescription>
              {formatDate(release.createdAt)}
            </CardDescription>
          </div>
          <StatusBadge status={release.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <Stat label="Downloads" value={release.stats.totalDownloads} />
          <Stat label="Installs" value={release.stats.totalInstalls} />
          <Stat label="Crashes" value={release.stats.totalCrashes} />
          <Stat label="Rollbacks" value={release.stats.totalRollbacks} />
        </div>
      </CardContent>
      <CardFooter>
        <ReleaseActions release={release} />
      </CardFooter>
    </Card>
  )
}
```

#### Targeting Rules Editor
```tsx
// components/targeting/targeting-editor.tsx
export function TargetingEditor({
  value,
  onChange,
}: {
  value: TargetingRules | null
  onChange: (rules: TargetingRules | null) => void
}) {
  return (
    <div className="space-y-4">
      <Select
        value={value?.match || 'all'}
        onValueChange={(match) => onChange({ ...value, match })}
      >
        <SelectItem value="all">All rules must match</SelectItem>
        <SelectItem value="any">Any rule must match</SelectItem>
      </Select>

      {value?.rules.map((rule, index) => (
        <RuleRow
          key={index}
          rule={rule}
          onChange={(updated) => updateRule(index, updated)}
          onRemove={() => removeRule(index)}
        />
      ))}

      <Button onClick={addRule}>Add Rule</Button>
    </div>
  )
}
```

### API Client

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.bundlenudge.com'

export const api = {
  // Apps
  getApps: () => fetch(`${API_URL}/v1/apps`).then(r => r.json()),
  getApp: (id: string) => fetch(`${API_URL}/v1/apps/${id}`).then(r => r.json()),
  createApp: (data) => fetch(`${API_URL}/v1/apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),

  // Releases
  getReleases: (appId: string) =>
    fetch(`${API_URL}/v1/releases?appId=${appId}`).then(r => r.json()),
  createRelease: (formData: FormData) =>
    fetch(`${API_URL}/v1/releases`, { method: 'POST', body: formData }).then(r => r.json()),
  rollbackRelease: (id: string, reason: string) =>
    fetch(`${API_URL}/v1/releases/${id}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).then(r => r.json()),

  // Stats
  getAppStats: (appId: string) =>
    fetch(`${API_URL}/v1/apps/${appId}/stats`).then(r => r.json()),
}
```

### Tests Required

1. API client works with all endpoints
2. Release list renders correctly
3. Release creation with file upload
4. Targeting rules editor creates valid rules
5. Rollback confirmation dialog

### Migration Steps

1. Copy base structure from codepush
2. Rename CodePush → BundleNudge
3. Update API endpoints
4. Add targeting rules UI
5. Add rollback controls
6. Update styling/branding
