'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  mockAudienceTesters,
  mockRegisteredDevices,
  mockAudienceStats,
} from '../mockData'

/**
 * AudiencePreview
 *
 * Mock audience tab shown in the onboarding preview modal.
 * Demonstrates what the audience tab looks like with testers and devices.
 */
export function AudiencePreview() {
  return (
    <div className="space-y-4">
      {/* Tabs Preview */}
      <Tabs defaultValue="testers" className="w-full">
        <TabsList>
          <TabsTrigger value="testers">Testers</TabsTrigger>
          <TabsTrigger value="devices">SDK Devices</TabsTrigger>
        </TabsList>

        {/* Testers Tab */}
        <TabsContent value="testers" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Emails Sent</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAudienceTesters.map((tester) => (
                  <TableRow key={tester.id}>
                    <TableCell className="font-medium">
                      {tester.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tester.name}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tester.stats?.totalSent ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tester.stats?.totalOpened ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Testers Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatCard
              label="Total Testers"
              value={mockAudienceStats.testers.total}
            />
            <StatCard
              label="Emails Sent"
              value={mockAudienceStats.testers.emailsSent}
            />
            <StatCard
              label="Emails Opened"
              value={mockAudienceStats.testers.emailsOpened}
            />
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRegisteredDevices.map((device) => (
                  <TableRow
                    key={device.id}
                    className={device.revoked ? 'opacity-60' : ''}
                  >
                    <TableCell>
                      <span className="font-mono text-xs">
                        {device.device_id.slice(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell>
                      <PlatformBadge platform={device.platform} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {device.fingerprint?.model ?? '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge revoked={device.revoked} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Device Stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <StatCard
              label="Total Devices"
              value={mockAudienceStats.devices.total}
            />
            <StatCard
              label="Active"
              value={mockAudienceStats.devices.active}
              highlight="success"
            />
            <StatCard label="iOS" value={mockAudienceStats.devices.ios} />
            <StatCard
              label="Android"
              value={mockAudienceStats.devices.android}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: 'success' | 'destructive'
}) {
  return (
    <div className="bg-background rounded-lg border p-3">
      <div
        className={`text-xl font-semibold ${
          highlight === 'success'
            ? 'text-green-600 dark:text-green-400'
            : highlight === 'destructive'
              ? 'text-red-600 dark:text-red-400'
              : 'text-foreground'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function PlatformBadge({ platform }: { platform: 'ios' | 'android' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
        platform === 'ios'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      }`}
    >
      {platform === 'ios' ? 'iOS' : 'Android'}
    </span>
  )
}

function StatusBadge({ revoked }: { revoked: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
        revoked
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      }`}
    >
      {revoked ? 'Revoked' : 'Active'}
    </span>
  )
}
