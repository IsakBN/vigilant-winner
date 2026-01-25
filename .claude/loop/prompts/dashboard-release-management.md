# Feature: dashboard/release-management

Implement release management pages.

## Knowledge Docs to Read First

- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Dashboard components
- `.claude/knowledge/API_FEATURES.md` → Releases endpoints

## Dependencies

- `dashboard/app-detail` (must complete first)
- `dashboard/api-client` (must complete first)

## What to Implement

### 1. Releases List Component

```tsx
// components/dashboard/ReleasesList.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateReleaseDialog } from './CreateReleaseDialog'
import { ReleaseDetailSheet } from './ReleaseDetailSheet'
import { formatDistanceToNow } from 'date-fns'

interface ReleasesListProps {
  appId: string
}

export function ReleasesList({ appId }: ReleasesListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['releases', appId],
    queryFn: () => api.releases.list(appId),
    staleTime: 30000,
  })

  if (isLoading) {
    return <ReleasesListSkeleton />
  }

  const releases = data?.releases || []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Releases</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Release
        </Button>
      </div>

      {releases.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium">No releases yet</h3>
          <p className="text-gray-500 mt-1">Create your first release to push updates</p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Release
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Rollout</TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead>Installs</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.map(release => (
              <TableRow
                key={release.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedReleaseId(release.id)}
              >
                <TableCell className="font-medium">{release.version}</TableCell>
                <TableCell>
                  <Badge variant={release.channel === 'production' ? 'default' : 'secondary'}>
                    {release.channel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${release.rolloutPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">{release.rolloutPercentage}%</span>
                  </div>
                </TableCell>
                <TableCell>{(release.downloads || 0).toLocaleString()}</TableCell>
                <TableCell>{(release.installs || 0).toLocaleString()}</TableCell>
                <TableCell className="text-gray-500">
                  {formatDistanceToNow(new Date(release.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {release.isDisabled ? (
                    <Badge variant="destructive">Disabled</Badge>
                  ) : release.isMandatory ? (
                    <Badge variant="outline">Mandatory</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateReleaseDialog
        appId={appId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedReleaseId && (
        <ReleaseDetailSheet
          appId={appId}
          releaseId={selectedReleaseId}
          open={!!selectedReleaseId}
          onOpenChange={(open) => !open && setSelectedReleaseId(null)}
        />
      )}
    </div>
  )
}
```

### 2. Release Detail Sheet

```tsx
// components/dashboard/ReleaseDetailSheet.tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Release } from '@/lib/api'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ReleaseMetrics } from './ReleaseMetrics'
import { UpdateFunnel } from './UpdateFunnel'
import { useState } from 'react'

interface ReleaseDetailSheetProps {
  appId: string
  releaseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReleaseDetailSheet({ appId, releaseId, open, onOpenChange }: ReleaseDetailSheetProps) {
  const queryClient = useQueryClient()
  const [rolloutValue, setRolloutValue] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['release', appId, releaseId],
    queryFn: () => api.releases.get(appId, releaseId),
    enabled: open,
    staleTime: 15000,
  })

  const updateRolloutMutation = useMutation({
    mutationFn: (percentage: number) =>
      api.releases.updateRollout(appId, releaseId, percentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['release', appId, releaseId] })
      queryClient.invalidateQueries({ queryKey: ['releases', appId] })
    },
  })

  const disableMutation = useMutation({
    mutationFn: () => api.releases.disable(appId, releaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['release', appId, releaseId] })
      queryClient.invalidateQueries({ queryKey: ['releases', appId] })
    },
  })

  const release = data?.release

  const handleRolloutChange = (value: number[]) => {
    setRolloutValue(value[0])
  }

  const handleRolloutCommit = () => {
    if (rolloutValue !== null && rolloutValue !== release?.rolloutPercentage) {
      updateRolloutMutation.mutate(rolloutValue)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        {isLoading || !release ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Version {release.version}
                {release.isDisabled ? (
                  <Badge variant="destructive">Disabled</Badge>
                ) : release.isMandatory ? (
                  <Badge>Mandatory</Badge>
                ) : null}
              </SheetTitle>
              <SheetDescription>
                {release.channel} channel
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Metrics */}
              <ReleaseMetrics release={release} />

              {/* Update Funnel */}
              <UpdateFunnel release={release} />

              {/* Rollout Control */}
              <Card>
                <CardHeader>
                  <CardTitle>Rollout Percentage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[rolloutValue ?? release.rolloutPercentage]}
                      onValueChange={handleRolloutChange}
                      max={100}
                      step={1}
                      disabled={release.isDisabled}
                      className="flex-1"
                    />
                    <span className="w-12 text-right font-medium">
                      {rolloutValue ?? release.rolloutPercentage}%
                    </span>
                  </div>

                  {rolloutValue !== null && rolloutValue !== release.rolloutPercentage && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRolloutCommit}
                        disabled={updateRolloutMutation.isPending}
                      >
                        {updateRolloutMutation.isPending ? 'Saving...' : 'Apply'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRolloutValue(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRolloutMutation.mutate(10)}
                      disabled={release.isDisabled}
                    >
                      10%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRolloutMutation.mutate(50)}
                      disabled={release.isDisabled}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRolloutMutation.mutate(100)}
                      disabled={release.isDisabled}
                    >
                      100%
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {release.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Release Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{release.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!release.isDisabled && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          Disable Release
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable this release?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will stop all devices from receiving this update. Existing installs will not be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => disableMutation.mutate()}
                          >
                            Disable
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

### 3. Release Metrics Component

```tsx
// components/dashboard/ReleaseMetrics.tsx
import { Release } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'

interface ReleaseMetricsProps {
  release: Release
}

export function ReleaseMetrics({ release }: ReleaseMetricsProps) {
  const metrics = [
    { label: 'Downloads', value: release.downloads || 0, color: 'text-blue-600' },
    { label: 'Installs', value: release.installs || 0, color: 'text-green-600' },
    { label: 'Rollbacks', value: release.rollbacks || 0, color: 'text-red-600' },
  ]

  const successRate = release.downloads
    ? ((release.installs || 0) / release.downloads * 100).toFixed(1)
    : 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-4 gap-4">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{successRate}%</p>
            <p className="text-sm text-gray-500">Success Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4. Update Funnel Component

```tsx
// components/dashboard/UpdateFunnel.tsx
import { Release } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UpdateFunnelProps {
  release: Release
}

export function UpdateFunnel({ release }: UpdateFunnelProps) {
  const downloads = release.downloads || 0
  const installs = release.installs || 0
  const rollbacks = release.rollbacks || 0

  const stages = [
    { label: 'Downloaded', count: downloads, width: 100 },
    { label: 'Installed', count: installs, width: downloads ? (installs / downloads) * 100 : 0 },
    { label: 'Rolled Back', count: rollbacks, width: downloads ? (rollbacks / downloads) * 100 : 0, color: 'bg-red-500' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map(({ label, count, width, color }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{label}</span>
              <span className="font-medium">{count.toLocaleString()}</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color || 'bg-blue-500'} transition-all duration-300`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

## Files to Create

1. `components/dashboard/ReleasesList.tsx`
2. `components/dashboard/CreateReleaseDialog.tsx`
3. `components/dashboard/ReleaseDetailSheet.tsx`
4. `components/dashboard/ReleaseMetrics.tsx`
5. `components/dashboard/UpdateFunnel.tsx`
6. `components/dashboard/RolloutSlider.tsx`

## Acceptance Criteria

- [ ] Releases table with stats
- [ ] Create release dialog
- [ ] Release detail sheet
- [ ] Rollout slider with quick actions
- [ ] Update funnel visualization
- [ ] Disable release with confirmation
- [ ] Real-time stat updates
