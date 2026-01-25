# Feature: dashboard/app-detail

Implement the app detail page with overview and settings.

## Knowledge Docs to Read First

- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Dashboard components
- `.claude/knowledge/API_FEATURES.md` → Apps/releases endpoints

## Dependencies

- `dashboard/app-list` (must complete first)
- `dashboard/api-client` (must complete first)

## What to Implement

### 1. App Detail Page

```tsx
// app/(dashboard)/dashboard/[accountId]/apps/[appId]/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppOverview } from '@/components/dashboard/AppOverview'
import { AppSettings } from '@/components/dashboard/AppSettings'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppDetailPage({ params }: { params: { accountId: string; appId: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['apps', params.appId],
    queryFn: () => api.apps.get(params.appId),
  })

  if (isLoading) {
    return <AppDetailSkeleton />
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">App not found</h2>
        <p className="text-gray-500 mt-1">This app doesn't exist or you don't have access</p>
      </div>
    )
  }

  const { app } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{app.name}</h1>
        {app.bundleId && <p className="text-gray-500">{app.bundleId}</p>}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AppOverview app={app} />
        </TabsContent>

        <TabsContent value="releases" className="mt-6">
          <ReleasesList appId={app.id} />
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <DevicesList appId={app.id} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <AppSettings app={app} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AppDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

### 2. App Overview Component

```tsx
// components/dashboard/AppOverview.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { api, App } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { VersionDistribution } from '@/components/dashboard/VersionDistribution'
import { Sparkline } from '@/components/dashboard/Sparkline'

interface AppOverviewProps {
  app: App
}

export function AppOverview({ app }: AppOverviewProps) {
  const { data: statsData } = useQuery({
    queryKey: ['app-stats', app.id],
    queryFn: () => api.apps.getStats(app.id, '7d'),
    staleTime: 60000,
  })

  // Process stats for display
  const dailyChecks = statsData?.stats.filter(s => s.event === 'check') || []
  const dailyDownloads = statsData?.stats.filter(s => s.event === 'download') || []
  const dailyInstalls = statsData?.stats.filter(s => s.event === 'apply') || []

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Monthly Active Users"
          value={statsData?.mau || 0}
          description="Last 30 days"
        />
        <StatCard
          title="Update Checks"
          value={dailyChecks.reduce((sum, d) => sum + d.count, 0)}
          description="Last 7 days"
          sparkline={<Sparkline data={dailyChecks.map(d => d.count)} />}
        />
        <StatCard
          title="Downloads"
          value={dailyDownloads.reduce((sum, d) => sum + d.count, 0)}
          description="Last 7 days"
          sparkline={<Sparkline data={dailyDownloads.map(d => d.count)} color="green" />}
        />
        <StatCard
          title="Installs"
          value={dailyInstalls.reduce((sum, d) => sum + d.count, 0)}
          description="Last 7 days"
          sparkline={<Sparkline data={dailyInstalls.map(d => d.count)} color="blue" />}
        />
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="flex-1 p-3 bg-gray-100 rounded font-mono text-sm">
              {app.apiKey}
            </code>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(app.apiKey)}>
              Copy
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Use this key to authenticate your app with BundleNudge
          </p>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`import { BundleNudge } from '@bundlenudge/sdk';

await BundleNudge.initialize({
  appId: '${app.id}',
  apiKey: '${app.apiKey}',
});`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. App Settings Component

```tsx
// components/dashboard/AppSettings.tsx
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, App } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

const updateAppSchema = z.object({
  name: z.string().min(1).max(100),
  bundleId: z.string().optional(),
})

interface AppSettingsProps {
  app: App
}

export function AppSettings({ app }: AppSettingsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(updateAppSchema),
    defaultValues: {
      name: app.name,
      bundleId: app.bundleId || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; bundleId?: string }) =>
      api.apps.update(app.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps', app.id] })
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update')
    },
  })

  const regenerateKeyMutation = useMutation({
    mutationFn: () => api.apps.regenerateKey(app.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps', app.id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.apps.delete(app.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      router.push('/dashboard')
    },
  })

  const onSubmit = (data: { name: string; bundleId?: string }) => {
    setError(null)
    updateMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic app information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">App Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundleId">Bundle ID</Label>
              <Input id="bundleId" {...register('bundleId')} />
            </div>

            <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>Regenerate your API key if it's been compromised</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Regenerate API Key</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will invalidate your current API key. You'll need to update your app with the new key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => regenerateKeyMutation.mutate()}>
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete App</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {app.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All releases, devices, and data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteMutation.mutate()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4. Stat Card Component

```tsx
// components/dashboard/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  sparkline?: ReactNode
  trend?: number
}

export function StatCard({ title, value, description, sparkline, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {sparkline}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {trend !== undefined && (
          <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

## Files to Create

1. `app/(dashboard)/dashboard/[accountId]/apps/[appId]/page.tsx`
2. `components/dashboard/AppOverview.tsx`
3. `components/dashboard/AppSettings.tsx`
4. `components/dashboard/StatCard.tsx`
5. `components/dashboard/Sparkline.tsx`
6. `components/dashboard/VersionDistribution.tsx`

## Acceptance Criteria

- [ ] Tabs for Overview, Releases, Devices, Settings
- [ ] Stats display with sparklines
- [ ] API key display with copy
- [ ] Quick start code snippet
- [ ] Update app settings
- [ ] Regenerate API key with confirmation
- [ ] Delete app with confirmation
- [ ] Loading and error states
