'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useDevices,
  useRevokeDevice,
  type DevicePlatform,
} from '@/hooks/useDevices'
import {
  useTesters,
  useCreateTester,
  useDeleteTester,
  useImportTesters,
  useExportTesters,
} from '@/hooks/useTesters'

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${String(minutes)}m ago`
  if (hours < 24) return `${String(hours)}h ago`
  if (days < 7) return `${String(days)}d ago`

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// Main Component
// =============================================================================

export default function AudiencePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const accountId = params.accountId as string
  const appId = params.appId as string
  const currentTab = searchParams.get('tab') ?? 'testers'

  // Testers state - using real API hooks
  const {
    testers,
    isLoading: testersLoading,
    isError: testersError,
  } = useTesters(appId)
  const createTesterMutation = useCreateTester(appId)
  const deleteTesterMutation = useDeleteTester(appId)
  const importTestersMutation = useImportTesters(appId)
  const exportTestersMutation = useExportTesters(appId)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newTester, setNewTester] = useState({ email: '', name: '' })
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkCsv, setBulkCsv] = useState('')

  const testerSubmitting = createTesterMutation.isPending || importTestersMutation.isPending

  // Devices state - using real API hooks
  const [platformFilter, setPlatformFilter] = useState<'all' | 'ios' | 'android'>('all')
  const [page, setPage] = useState(1)
  const limit = 20
  const offset = (page - 1) * limit

  // Fetch devices using the real API
  const {
    devices,
    pagination,
    isLoading: devicesLoading,
    isError: devicesError,
  } = useDevices(appId, {
    limit,
    offset,
    platform: platformFilter === 'all' ? undefined : platformFilter as DevicePlatform,
  })

  // Revoke device mutation
  const revokeDeviceMutation = useRevokeDevice(appId)

  // Calculate total pages from pagination
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 0

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/${accountId}/apps/${appId}/audience?tab=${value}`)
  }

  async function handleAddTester(e: React.FormEvent) {
    e.preventDefault()
    if (!newTester.email) return

    await createTesterMutation.mutateAsync({
      email: newTester.email.trim(),
      name: newTester.name.trim() || undefined,
    })
    setNewTester({ email: '', name: '' })
    setAddDialogOpen(false)
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault()
    if (!bulkCsv.trim()) return

    await importTestersMutation.mutateAsync(bulkCsv)
    setBulkCsv('')
    setBulkDialogOpen(false)
  }

  function handleDeleteTester(testerId: string) {
    deleteTesterMutation.mutate(testerId)
  }

  async function handleExport() {
    const result = await exportTestersMutation.mutateAsync()
    const blob = new Blob([result.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `testers-${appId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleRevokeDevice(deviceId: string) {
    revokeDeviceMutation.mutate(deviceId)
  }

  const isLoading = testersLoading || devicesLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/${accountId}/apps/${appId}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
        <h2 className="text-lg font-semibold text-neutral-900">Audience</h2>
        <p className="text-sm text-neutral-500">
          {testers.length} tester{testers.length !== 1 ? 's' : ''} &bull;{' '}
          {pagination?.total ?? 0} device{(pagination?.total ?? 0) !== 1 ? 's' : ''} registered
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="testers">Testers</TabsTrigger>
          <TabsTrigger value="devices">SDK Devices</TabsTrigger>
        </TabsList>

        {/* Testers Tab */}
        <TabsContent value="testers" className="mt-6">
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              {testers.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => void handleExport()}
                  disabled={exportTestersMutation.isPending}
                >
                  {exportTestersMutation.isPending ? 'Exporting...' : 'Export CSV'}
                </Button>
              )}

              {/* Bulk Import Dialog */}
              <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Bulk Import</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => void handleBulkImport(e)}>
                    <DialogHeader>
                      <DialogTitle>Bulk Import Testers</DialogTitle>
                      <DialogDescription>
                        Paste tester emails, one per line. Format: email, name (name
                        optional)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <textarea
                        className="w-full h-48 px-3 py-2 text-sm border border-neutral-200 font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        placeholder={`john@example.com, John Doe\njane@example.com\ntest@company.com, Test User`}
                        value={bulkCsv}
                        onChange={(e) => setBulkCsv(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBulkDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={testerSubmitting || !bulkCsv.trim()}
                      >
                        {testerSubmitting ? 'Importing...' : 'Import'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Add Tester Dialog */}
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Tester</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => void handleAddTester(e)}>
                    <DialogHeader>
                      <DialogTitle>Add Tester</DialogTitle>
                      <DialogDescription>
                        Add a tester to receive build notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tester@example.com"
                          value={newTester.email}
                          onChange={(e) =>
                            setNewTester({ ...newTester, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name (optional)</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={newTester.name}
                          onChange={(e) =>
                            setNewTester({ ...newTester, name: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={testerSubmitting || !newTester.email}
                      >
                        {testerSubmitting ? 'Adding...' : 'Add Tester'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Testers Table */}
            {testersError ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-red-50 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    Failed to load testers
                  </h3>
                  <p className="text-sm text-neutral-500">
                    There was an error loading the testers. Please try again.
                  </p>
                </CardContent>
              </Card>
            ) : testers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">No testers yet</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Add testers to notify them when new builds are ready.
                  </p>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    Add First Tester
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Emails Sent</TableHead>
                        <TableHead>Last Notified</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testers.map((tester) => (
                        <TableRow key={tester.id}>
                          <TableCell className="font-medium text-neutral-900">
                            {tester.email}
                          </TableCell>
                          <TableCell className="text-neutral-600">
                            {tester.name ?? '-'}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-neutral-500">
                              {tester.stats?.totalSent ?? 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-500">
                            {tester.stats?.lastSentAt
                              ? formatRelativeTime(tester.stats.lastSentAt)
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-sm text-neutral-500">
                            {formatRelativeTime(tester.createdAt)}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleDeleteTester(tester.id)}
                              disabled={deleteTesterMutation.isPending}
                              className="text-neutral-400 hover:text-destructive transition-colors disabled:opacity-50"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-semibold text-neutral-900">
                        {testers.length}
                      </div>
                      <div className="text-sm text-neutral-500">Total Testers</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-semibold text-neutral-900">
                        {testers.reduce((sum, t) => sum + (t.stats?.totalSent ?? 0), 0)}
                      </div>
                      <div className="text-sm text-neutral-500">Emails Sent</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-2xl font-semibold text-neutral-900">
                        {testers.reduce(
                          (sum, t) => sum + (t.stats?.totalOpened ?? 0),
                          0
                        )}
                      </div>
                      <div className="text-sm text-neutral-500">Emails Opened</div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="mt-6">
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <Select
                value={platformFilter}
                onValueChange={(value) => {
                  setPlatformFilter(value as 'all' | 'ios' | 'android')
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info Card */}
            <Card className="bg-neutral-50 border-neutral-200">
              <CardContent className="py-4">
                <h3 className="font-medium text-neutral-900 mb-2">
                  About Keyless Authentication
                </h3>
                <p className="text-sm text-neutral-600">
                  Devices using keyless SDK authentication automatically register on
                  first app launch. Each device receives a unique token that allows it
                  to check for and download updates without embedding API keys in your
                  app. You can revoke access for any device if needed.
                </p>
              </CardContent>
            </Card>

            {/* Devices Table */}
            {devicesError ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-red-50 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    Failed to load devices
                  </h3>
                  <p className="text-sm text-neutral-500">
                    There was an error loading the devices. Please try again.
                  </p>
                </CardContent>
              </Card>
            ) : devices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">
                    No devices registered
                  </h3>
                  <p className="text-sm text-neutral-500 mb-4 max-w-md mx-auto">
                    Devices will appear here when they connect using keyless SDK
                    authentication. Enable keyless mode in your app by setting{' '}
                    <code className="bg-neutral-100 px-1">keyless: true</code> in your
                    BundleNudge config.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device ID</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>App Version</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => {
                        const isRevoked = device.revokedAt !== null
                        return (
                          <TableRow
                            key={device.id}
                            className={isRevoked ? 'opacity-60' : ''}
                          >
                            <TableCell>
                              <div>
                                <span className="font-mono text-xs text-neutral-700">
                                  {device.deviceId.slice(0, 8)}...
                                  {device.deviceId.slice(-4)}
                                </span>
                                {device.deviceModel && (
                                  <span className="text-xs text-neutral-400 block">
                                    {device.deviceModel}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                                  device.platform === 'ios'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-green-50 text-green-700'
                                }`}
                              >
                                {device.platform === 'ios' ? 'iOS' : 'Android'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs text-neutral-500">
                                {device.appVersion ?? '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-neutral-600">
                                {device.lastSeenAt
                                  ? formatRelativeTime(device.lastSeenAt)
                                  : 'Never'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {isRevoked ? (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                                  Revoked
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                                  Active
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {!isRevoked && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevokeDevice(device.deviceId)}
                                  disabled={revokeDeviceMutation.isPending}
                                  className="text-neutral-400 hover:text-destructive"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                    />
                                  </svg>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-500">
                      Showing {offset + 1} to{' '}
                      {Math.min(offset + limit, pagination?.total ?? 0)}{' '}
                      of {pagination?.total ?? 0} devices
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1 || devicesLoading}
                        onClick={() => setPage((prev) => prev - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages || devicesLoading}
                        onClick={() => setPage((prev) => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
