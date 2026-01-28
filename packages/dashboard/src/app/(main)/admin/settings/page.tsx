'use client'

/**
 * Admin Settings Page
 *
 * System-wide admin settings for platform configuration, rate limits,
 * feature toggles, and notifications.
 */

import Link from 'next/link'
import { Settings, Gauge, Flag, Bell, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useFeatureFlags } from '@/hooks/useAdmin'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader />
            <PlatformSettingsSection />
            <RateLimitsSection />
            <FeatureTogglesSection />
            <NotificationsSection />
        </div>
    )
}

function PageHeader() {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-text-dark font-heading">Admin Settings</h1>
                <Badge variant="secondary">Coming soon</Badge>
            </div>
            <p className="text-text-light mt-1">
                System-wide configuration for your BundleNudge instance.
            </p>
        </div>
    )
}

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
            </div>
        </div>
    )
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            {children}
        </div>
    )
}

function PlatformSettingsSection() {
    return (
        <Card>
            <CardHeader>
                <SectionHeader icon={<Settings className="h-5 w-5" />} title="Platform Settings" desc="Core platform configuration options" />
            </CardHeader>
            <CardContent className="space-y-4">
                <SettingRow label="Maintenance Mode" desc="Disable access for non-admin users">
                    <Switch disabled checked={false} />
                </SettingRow>
                <SettingRow label="Registration Enabled" desc="Allow new users to sign up">
                    <Switch disabled checked={true} />
                </SettingRow>
                <div className="space-y-2">
                    <Label className="text-sm">Default Plan for New Users</Label>
                    <Input disabled value="free" className="max-w-xs" />
                    <p className="text-xs text-muted-foreground">Plan assigned to new accounts</p>
                </div>
            </CardContent>
        </Card>
    )
}

function RateLimitsSection() {
    return (
        <Card>
            <CardHeader>
                <SectionHeader icon={<Gauge className="h-5 w-5" />} title="Rate Limits" desc="Configure API and resource limits" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm">API Rate Limit (req/min)</Label>
                        <Input disabled type="number" value="60" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm">Bundle Upload Size (MB)</Label>
                        <Input disabled type="number" value="100" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm">Max Apps per Account</Label>
                        <Input disabled type="number" value="10" />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    For detailed rate limits, visit the{' '}
                    <Link href="/admin/config" className="text-primary underline">System Configuration</Link> page.
                </p>
            </CardContent>
        </Card>
    )
}

function FeatureTogglesSection() {
    const { flags, isLoading } = useFeatureFlags()
    const criticalFlags = flags.filter((f) => f.key.startsWith('system_')).slice(0, 3)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <SectionHeader icon={<Flag className="h-5 w-5" />} title="Feature Toggles" desc="Quick access to critical flags" />
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/feature-flags">
                            Manage All <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading flags...</p>
                ) : criticalFlags.length > 0 ? (
                    criticalFlags.map((flag) => (
                        <SettingRow key={flag.id} label={flag.name} desc={flag.key}>
                            <Switch disabled checked={flag.enabled} />
                        </SettingRow>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No system flags. Create flags with &quot;system_&quot; prefix to show here.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

function NotificationsSection() {
    return (
        <Card>
            <CardHeader>
                <SectionHeader icon={<Bell className="h-5 w-5" />} title="Notifications" desc="Configure admin alerts" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm">Admin Alert Email</Label>
                    <Input disabled type="email" placeholder="admin@example.com" />
                    <p className="text-xs text-muted-foreground">Receives critical system alerts</p>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm">Slack Webhook URL</Label>
                    <Input disabled type="password" value="https://hooks.slack.com/..." />
                    <p className="text-xs text-muted-foreground">Send notifications to Slack</p>
                </div>
            </CardContent>
        </Card>
    )
}
