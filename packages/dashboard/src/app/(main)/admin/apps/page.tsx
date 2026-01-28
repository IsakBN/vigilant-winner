'use client'

/**
 * Admin Apps Page - Global apps management for administrators.
 */

import { useState, useCallback } from 'react'
import { useAdminApps, useUpdateAppStatus, useDeleteAdminApp } from '@/hooks/useAdminOps'
import { Card, CardContent, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Smartphone, Apple, MoreVertical, Power, PowerOff, Trash2, RefreshCw } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { AdminApp, ListAdminAppsParams, AdminAppStatus } from '@/lib/api'

const PAGE_SIZE = 20
const PLATFORM_ICONS = { ios: Apple, android: Smartphone, both: Smartphone }

export default function AdminAppsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AdminAppStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const params: ListAdminAppsParams = {
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    page,
    limit: PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }

  const { apps, total, totalPages, isLoading, refetch } = useAdminApps(params)
  const updateStatus = useUpdateAppStatus()
  const deleteApp = useDeleteAdminApp()

  const handleToggleStatus = useCallback((app: AdminApp) => {
    const newStatus = app.status === 'active' ? 'disabled' : 'active'
    if (confirm(`${newStatus === 'disabled' ? 'Disable' : 'Enable'} ${app.name}?`)) {
      updateStatus.mutate({ appId: app.id, status: newStatus })
    }
  }, [updateStatus])

  const handleDelete = useCallback((app: AdminApp) => {
    if (confirm(`Delete ${app.name}? This cannot be undone.`)) {
      deleteApp.mutate(app.id)
    }
  }, [deleteApp])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Apps</h1>
          <p className="text-text-light mt-1">Manage all apps ({total.toLocaleString()} total)</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <Input placeholder="Search apps..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as AdminAppStatus | 'all'); setPage(1) }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <AppsSkeleton />
      ) : (
        <>
          <AppsTable apps={apps} onToggleStatus={handleToggleStatus} onDelete={handleDelete} isPending={updateStatus.isPending || deleteApp.isPending} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-light">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface AppsTableProps {
  apps: AdminApp[]
  onToggleStatus: (app: AdminApp) => void
  onDelete: (app: AdminApp) => void
  isPending: boolean
}

function AppsTable({ apps, onToggleStatus, onDelete, isPending }: AppsTableProps) {
  if (apps.length === 0) {
    return <Card><CardContent className="py-12 text-center text-text-light">No apps found</CardContent></Card>
  }

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-sm font-medium text-text-light">App</th>
              <th className="text-left p-4 text-sm font-medium text-text-light">Organization</th>
              <th className="text-left p-4 text-sm font-medium text-text-light">Platform</th>
              <th className="text-right p-4 text-sm font-medium text-text-light">Bundles</th>
              <th className="text-right p-4 text-sm font-medium text-text-light">Downloads</th>
              <th className="text-left p-4 text-sm font-medium text-text-light">Status</th>
              <th className="text-right p-4 text-sm font-medium text-text-light">Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <AppRow key={app.id} app={app} onToggleStatus={onToggleStatus} onDelete={onDelete} isPending={isPending} />
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

interface AppRowProps {
  app: AdminApp
  onToggleStatus: (app: AdminApp) => void
  onDelete: (app: AdminApp) => void
  isPending: boolean
}

function AppRow({ app, onToggleStatus, onDelete, isPending }: AppRowProps) {
  const PlatformIcon = PLATFORM_ICONS[app.platform]
  const isActive = app.status === 'active'

  return (
    <tr className="border-b last:border-0">
      <td className="p-4">
        <p className="font-medium text-text-dark">{app.name}</p>
        <p className="text-xs text-text-light">{app.id}</p>
      </td>
      <td className="p-4 text-text-light">{app.orgName}</td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <PlatformIcon className="w-4 h-4 text-text-light" />
          <span className="text-sm capitalize">{app.platform}</span>
        </div>
      </td>
      <td className="p-4 text-right">{app.bundleCount}</td>
      <td className="p-4 text-right">{app.totalDownloads.toLocaleString()}</td>
      <td className="p-4">
        <Badge variant="outline" className={isActive ? 'bg-pastel-green/20 text-pastel-green' : 'bg-gray-100 text-gray-600'}>
          {app.status}
        </Badge>
      </td>
      <td className="p-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}><MoreVertical className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleStatus(app)}>
              {isActive ? <><PowerOff className="w-4 h-4 mr-2" />Disable</> : <><Power className="w-4 h-4 mr-2" />Enable</>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(app)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

function AppsSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
