# Feature: dashboard/admin-pages

Implement admin dashboard pages.

## Knowledge Docs to Read First

- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Admin components
- `.claude/knowledge/API_FEATURES.md` → Admin endpoints

## Dependencies

- `dashboard/scaffold` (must complete first)
- `dashboard/api-client` (must complete first)
- `api/admin-auth` (must complete first)
- `api/admin-dashboard` (must complete first)

## What to Implement

### 1. Admin Layout

```tsx
// app/admin/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLoginDialog } from '@/components/admin/AdminLoginDialog'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    // Check for admin session
    const adminSession = document.cookie.includes('admin_session=')
    if (!adminSession) {
      setShowLogin(true)
      setIsAuthenticated(false)
    } else {
      setIsAuthenticated(true)
    }
  }, [])

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <AdminLoginDialog open={showLogin} onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
```

### 2. Admin Overview Page

```tsx
// app/admin/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import { HealthIndicator } from '@/components/admin/HealthIndicator'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.admin.getStats(),
    refetchInterval: 30000,
  })

  const { data: healthData } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api.admin.getHealth(),
    refetchInterval: 60000,
  })

  const { data: metricsData } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.admin.getMetrics(30),
  })

  const { data: activityData } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => api.admin.getActivity(20),
    refetchInterval: 30000,
  })

  if (statsLoading) {
    return <AdminOverviewSkeleton />
  }

  const stats = statsData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <HealthIndicator status={healthData?.status || 'unknown'} />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          description={`+${stats?.users.newThisMonth || 0} this month`}
        />
        <StatCard
          title="Total Apps"
          value={stats?.apps.total || 0}
          description={`${stats?.apps.activeThisMonth || 0} active`}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${(stats?.revenue.mrr || 0).toLocaleString()}`}
          description="MRR"
        />
        <StatCard
          title="Total MAU"
          value={(stats?.mau.total || 0).toLocaleString()}
          description="Across all apps"
        />
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricsData?.users || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.revenue.subscriptionsByPlan || {}).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className="capitalize font-medium">{plan}</span>
                  <span className="text-gray-500">{count} users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed entries={activityData?.activity || []} />
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(healthData?.services || {}).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="capitalize font-medium">{service}</span>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${status.ok ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-500">{status.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. Admin Users Page

```tsx
// app/admin/users/page.tsx
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { UserDetailModal } from '@/components/admin/UserDetailModal'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontalIcon, SearchIcon } from 'lucide-react'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search }],
    queryFn: () => api.admin.listUsers({ search }),
  })

  const impersonateMutation = useMutation({
    mutationFn: (userId: string) => api.admin.impersonateUser(userId),
    onSuccess: (data) => {
      // Open dashboard in new tab with impersonation session
      window.open(`/dashboard?session=${data.sessionId}`, '_blank')
    },
  })

  const users = data?.users || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Apps</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.plan_id === 'enterprise' ? 'default' : 'outline'}>
                  {user.plan_id || 'free'}
                </Badge>
              </TableCell>
              <TableCell>{user.app_count || 0}</TableCell>
              <TableCell>
                {user.email_verified ? (
                  <Badge variant="outline" className="text-green-600">Verified</Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600">Unverified</Badge>
                )}
              </TableCell>
              <TableCell className="text-gray-500">
                {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedUserId(user.id)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => impersonateMutation.mutate(user.id)}>
                      Impersonate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={!!selectedUserId}
          onOpenChange={(open) => !open && setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
```

### 4. Admin Login Dialog

```tsx
// components/admin/AdminLoginDialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

interface AdminLoginDialogProps {
  open: boolean
  onSuccess: () => void
}

export function AdminLoginDialog({ open, onSuccess }: AdminLoginDialogProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendOtp = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await api.admin.requestOtp({ email })
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await api.admin.verifyOtp({ email, otp })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? 'Enter your @bundlenudge.com email'
              : 'Enter the code sent to your email'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@bundlenudge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendOtp}
                disabled={isLoading || !email.endsWith('@bundlenudge.com')}
              >
                {isLoading ? 'Sending...' : 'Send Login Code'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Login'}
              </Button>
              <Button
                variant="link"
                className="w-full"
                onClick={() => setStep('email')}
              >
                Use different email
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Files to Create

1. `app/admin/layout.tsx`
2. `app/admin/page.tsx`
3. `app/admin/users/page.tsx`
4. `app/admin/apps/page.tsx`
5. `app/admin/subscriptions/page.tsx`
6. `components/admin/AdminLoginDialog.tsx`
7. `components/admin/AdminSidebar.tsx`
8. `components/admin/HealthIndicator.tsx`
9. `components/admin/ActivityFeed.tsx`
10. `components/admin/UserDetailModal.tsx`
11. `lib/api/admin.ts`

## Acceptance Criteria

- [ ] Admin OTP login
- [ ] Domain restriction (@bundlenudge.com)
- [ ] Overview with stats
- [ ] System health display
- [ ] User management table
- [ ] User detail modal
- [ ] Impersonation
- [ ] Activity feed
- [ ] Charts for metrics
