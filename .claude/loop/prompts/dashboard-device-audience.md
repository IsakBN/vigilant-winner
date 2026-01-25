# Feature: dashboard/device-audience

Implement device management pages.

## Knowledge Docs to Read First

- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Dashboard components
- `.claude/knowledge/API_FEATURES.md` → Devices endpoints

## Dependencies

- `dashboard/app-detail` (must complete first)
- `dashboard/api-client` (must complete first)

## What to Implement

### 1. Devices List Component

```tsx
// components/dashboard/DevicesList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { AppleIcon, AndroidIcon } from '@/components/icons'

interface DevicesListProps {
  appId: string
}

export function DevicesList({ appId }: DevicesListProps) {
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['devices', appId, { search, platform: platformFilter }],
    queryFn: () => api.devices.list(appId, { search, platform: platformFilter === 'all' ? undefined : platformFilter }),
    staleTime: 30000,
  })

  if (isLoading) {
    return <DevicesListSkeleton />
  }

  const devices = data?.devices || []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Registered Devices</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ios">iOS</SelectItem>
              <SelectItem value="android">Android</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium">No devices registered</h3>
          <p className="text-gray-500 mt-1">Devices will appear here when they check for updates</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>OS Version</TableHead>
              <TableHead>App Version</TableHead>
              <TableHead>Bundle Version</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map(device => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-sm">
                  {device.id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  {device.platform === 'ios' ? (
                    <div className="flex items-center gap-1">
                      <AppleIcon className="h-4 w-4" />
                      <span>iOS</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AndroidIcon className="h-4 w-4" />
                      <span>Android</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{device.model || '-'}</TableCell>
                <TableCell>{device.osVersion || '-'}</TableCell>
                <TableCell>{device.appVersion || '-'}</TableCell>
                <TableCell>
                  {device.bundleVersion ? (
                    <Badge variant="outline">{device.bundleVersion}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data?.total && data.total > devices.length && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {devices.length} of {data.total} devices
          </p>
        </div>
      )}
    </div>
  )
}

function DevicesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
```

### 2. Device Stats Overview

```tsx
// components/dashboard/DeviceStats.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DeviceStatsProps {
  appId: string
}

export function DeviceStats({ appId }: DeviceStatsProps) {
  const { data } = useQuery({
    queryKey: ['device-stats', appId],
    queryFn: () => api.devices.getStats(appId),
    staleTime: 60000,
  })

  if (!data) return null

  const platformData = [
    { name: 'iOS', value: data.ios, color: '#000000' },
    { name: 'Android', value: data.android, color: '#3DDC84' },
  ]

  const versionData = data.versionDistribution.map((v, i) => ({
    name: v.version,
    value: v.count,
    color: `hsl(${i * 30}, 70%, 50%)`,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platformData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={versionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {versionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. API Device Module

```typescript
// lib/api/devices.ts
import { apiGet, apiPost, apiDelete } from './client'

export interface Device {
  id: string
  appId: string
  platform: 'ios' | 'android'
  model?: string
  osVersion?: string
  appVersion?: string
  bundleVersion?: string
  lastSeenAt: string
  createdAt: string
}

export interface DeviceStats {
  total: number
  ios: number
  android: number
  versionDistribution: Array<{ version: string; count: number }>
}

export const devicesApi = {
  list: (appId: string, params?: { search?: string; platform?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.platform) query.set('platform', params.platform)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const queryString = query.toString()
    return apiGet<{ devices: Device[]; total: number }>(`/apps/${appId}/devices${queryString ? `?${queryString}` : ''}`)
  },

  get: (appId: string, deviceId: string) =>
    apiGet<{ device: Device }>(`/apps/${appId}/devices/${deviceId}`),

  getStats: (appId: string) =>
    apiGet<DeviceStats>(`/apps/${appId}/devices/stats`),

  revoke: (appId: string, deviceId: string) =>
    apiDelete<void>(`/apps/${appId}/devices/${deviceId}`),
}
```

## Files to Create

1. `components/dashboard/DevicesList.tsx`
2. `components/dashboard/DeviceStats.tsx`
3. `lib/api/devices.ts`
4. Update `lib/api/index.ts` to include devices

## Acceptance Criteria

- [ ] Devices table with search
- [ ] Platform filter
- [ ] Device stats with charts
- [ ] Version distribution pie chart
- [ ] Platform distribution chart
- [ ] Last seen timestamps
- [ ] Loading skeletons
