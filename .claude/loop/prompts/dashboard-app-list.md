# Feature: dashboard/app-list

Implement the apps list page.

## Knowledge Docs to Read First

- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Dashboard components
- `.claude/knowledge/API_FEATURES.md` → Apps endpoints

## Dependencies

- `dashboard/scaffold` (must complete first)
- `dashboard/api-client` (must complete first)
- `dashboard/auth-pages` (must complete first)

## What to Implement

### 1. Apps List Page

```tsx
// app/(dashboard)/dashboard/[accountId]/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { AppCard } from '@/components/dashboard/AppCard'
import { UsageDisplay } from '@/components/dashboard/UsageDisplay'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateAppDialog } from '@/components/dashboard/CreateAppDialog'
import { useState } from 'react'

export default function DashboardPage({ params }: { params: { accountId: string } }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: () => api.apps.list(),
  })

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => api.subscriptions.getUsage(),
  })

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.subscriptions.getCurrent(),
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apps</h1>
          <p className="text-gray-500">Manage your React Native apps</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New App
        </Button>
      </div>

      {/* Usage Overview */}
      {usageLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : usageData && subscriptionData ? (
        <UsageDisplay
          usage={usageData.usage}
          plan={subscriptionData.subscription.planId}
        />
      ) : null}

      {/* Apps Grid */}
      {appsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : appsData?.apps.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium">No apps yet</h3>
          <p className="text-gray-500 mt-1">Create your first app to get started</p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create App
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appsData?.apps.map(app => (
            <Link key={app.id} href={`/dashboard/${params.accountId}/apps/${app.id}`}>
              <AppCard app={app} />
            </Link>
          ))}
        </div>
      )}

      <CreateAppDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
```

### 2. App Card Component

```tsx
// components/dashboard/AppCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { App } from '@/lib/api/apps'
import { AppleIcon, AndroidIcon } from '@/components/icons'

interface AppCardProps {
  app: App
  onClick?: () => void
}

export function AppCard({ app, onClick }: AppCardProps) {
  const PlatformIcon = app.platform === 'android' ? AndroidIcon : AppleIcon

  return (
    <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{app.name}</CardTitle>
        <PlatformIcon className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {app.bundleId && (
            <p className="text-sm text-gray-500 truncate">{app.bundleId}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {app.releaseCount || 0} releases
            </span>
            <span className="text-gray-500">
              {app.deviceCount || 0} devices
            </span>
          </div>
          <Badge variant={app.platform === 'both' ? 'default' : 'secondary'}>
            {app.platform === 'both' ? 'iOS + Android' : app.platform.toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. Create App Dialog

```tsx
// components/dashboard/CreateAppDialog.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { api } from '@/lib/api'

const createAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  platform: z.enum(['ios', 'android', 'both']),
  bundleId: z.string().optional(),
})

type CreateAppData = z.infer<typeof createAppSchema>

interface CreateAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAppDialog({ open, onOpenChange }: CreateAppDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<CreateAppData>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      platform: 'ios',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAppData) => api.apps.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      onOpenChange(false)
      reset()
      router.push(`/dashboard/apps/${result.app.id}`)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create app')
    },
  })

  const onSubmit = (data: CreateAppData) => {
    setError(null)
    createMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new app</DialogTitle>
          <DialogDescription>
            Add a new React Native app to manage OTA updates
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">App Name</Label>
            <Input
              id="name"
              placeholder="My React Native App"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <RadioGroup
              value={watch('platform')}
              onValueChange={(value) => setValue('platform', value as 'ios' | 'android' | 'both')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ios" id="ios" />
                <Label htmlFor="ios">iOS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="android" id="android" />
                <Label htmlFor="android">Android</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both">Both</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bundleId">Bundle ID (optional)</Label>
            <Input
              id="bundleId"
              placeholder="com.example.myapp"
              {...register('bundleId')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create App'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. Usage Display Component

```tsx
// components/dashboard/UsageDisplay.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PLAN_LIMITS } from '@bundlenudge/shared'

interface UsageDisplayProps {
  usage: {
    mau: number
    storage: number
    apps: number
    teamMembers: number
  }
  plan: string
}

export function UsageDisplay({ usage, plan }: UsageDisplayProps) {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

  const mauPercent = Math.min(100, (usage.mau / limits.mauLimit) * 100)
  const storagePercent = Math.min(100, (usage.storage / (limits.storageGb * 1024 * 1024 * 1024)) * 100)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Active Users</span>
              <span className="font-medium">
                {usage.mau.toLocaleString()} / {limits.mauLimit === Infinity ? 'Unlimited' : limits.mauLimit.toLocaleString()}
              </span>
            </div>
            <Progress value={mauPercent} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage</span>
              <span className="font-medium">
                {formatBytes(usage.storage)} / {limits.storageGb === Infinity ? 'Unlimited' : `${limits.storageGb} GB`}
              </span>
            </div>
            <Progress value={storagePercent} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
```

## Files to Create

1. `app/(dashboard)/dashboard/[accountId]/page.tsx`
2. `components/dashboard/AppCard.tsx`
3. `components/dashboard/CreateAppDialog.tsx`
4. `components/dashboard/UsageDisplay.tsx`

## Acceptance Criteria

- [ ] List apps in grid
- [ ] Empty state for no apps
- [ ] Create app dialog
- [ ] Usage display with progress bars
- [ ] Link to app detail page
- [ ] Loading skeletons
- [ ] Platform icons
- [ ] Tests pass
