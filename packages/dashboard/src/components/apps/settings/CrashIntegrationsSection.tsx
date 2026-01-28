'use client'

/**
 * CrashIntegrationsSection Component
 *
 * Handles crash reporting integration management.
 */

import { useState } from 'react'
import { Trash2, Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast'
import {
    useCrashIntegrations,
    useCreateCrashIntegration,
    useUpdateCrashIntegration,
    useDeleteCrashIntegration,
} from '@/hooks/useCrashIntegrations'
import {
    CRASH_PROVIDERS,
    type CrashProvider,
    type SentryConfig,
    type BugsnagConfig,
} from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface CrashIntegrationsSectionProps {
    accountId: string
    appId: string
}

interface FormState {
    sentry: { dsn: string; organization: string; project: string; authToken: string }
    bugsnag: { apiKey: string; projectId: string }
    crashlytics: { projectId: string }
}

// =============================================================================
// Component
// =============================================================================

export function CrashIntegrationsSection({
    accountId,
    appId,
}: CrashIntegrationsSectionProps) {
    const { toast } = useToast()
    const { data, isLoading } = useCrashIntegrations(accountId, appId)
    const createIntegration = useCreateCrashIntegration(accountId, appId)
    const updateIntegration = useUpdateCrashIntegration(accountId, appId)
    const deleteIntegration = useDeleteCrashIntegration(accountId, appId)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [provider, setProvider] = useState<CrashProvider>('sentry')
    const [form, setForm] = useState<FormState>({
        sentry: { dsn: '', organization: '', project: '', authToken: '' },
        bugsnag: { apiKey: '', projectId: '' },
        crashlytics: { projectId: '' },
    })

    const integrations = data?.integrations ?? []

    const resetForm = () => {
        setForm({
            sentry: { dsn: '', organization: '', project: '', authToken: '' },
            bugsnag: { apiKey: '', projectId: '' },
            crashlytics: { projectId: '' },
        })
        setProvider('sentry')
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        const config =
            provider === 'sentry'
                ? { ...form.sentry }
                : provider === 'bugsnag'
                  ? { ...form.bugsnag }
                  : { ...form.crashlytics }

        // Remove empty optional fields
        const cleanConfig = Object.fromEntries(
            Object.entries(config).filter(([, v]) => v !== '')
        )

        try {
            await createIntegration.mutateAsync({
                provider,
                config: cleanConfig as typeof config,
            })
            resetForm()
            setDialogOpen(false)
            toast({ title: 'Integration added', variant: 'success' })
        } catch {
            toast({ title: 'Failed to add integration', variant: 'error' })
        }
    }

    const handleToggle = async (integrationId: string, enabled: boolean) => {
        try {
            await updateIntegration.mutateAsync({
                integrationId,
                data: { enabled },
            })
            toast({
                title: enabled ? 'Integration enabled' : 'Integration disabled',
                variant: 'success',
            })
        } catch {
            toast({ title: 'Failed to update integration', variant: 'error' })
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteIntegration.mutateAsync(deleteId)
            setDeleteId(null)
            toast({ title: 'Integration deleted', variant: 'success' })
        } catch {
            toast({ title: 'Failed to delete integration', variant: 'error' })
        }
    }

    const isFormValid = () => {
        if (provider === 'sentry') {
            return form.sentry.dsn && form.sentry.organization && form.sentry.project
        }
        if (provider === 'bugsnag') {
            return form.bugsnag.apiKey
        }
        return form.crashlytics.projectId
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Crash Reporting</CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">
                            Link crash reports with BundleNudge releases
                        </p>
                    </div>
                    <Dialog
                        open={dialogOpen}
                        onOpenChange={(open) => {
                            setDialogOpen(open)
                            if (!open) resetForm()
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Integration
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle>Add Crash Integration</DialogTitle>
                                    <DialogDescription>
                                        Connect your crash reporting service
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Provider</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {CRASH_PROVIDERS.map((p) => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => setProvider(p.value)}
                                                    className={`p-3 border text-left transition-colors rounded ${
                                                        provider === p.value
                                                            ? 'border-neutral-900 bg-neutral-50'
                                                            : 'border-neutral-200 hover:border-neutral-300'
                                                    }`}
                                                >
                                                    <span className="font-medium text-sm block">
                                                        {p.label}
                                                    </span>
                                                    <span className="text-xs text-neutral-500">
                                                        {p.description}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sentry Config */}
                                    {provider === 'sentry' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="sentry-dsn">DSN</Label>
                                                <Input
                                                    id="sentry-dsn"
                                                    placeholder="https://xxx@o123456.ingest.sentry.io/123"
                                                    value={form.sentry.dsn}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            sentry: {
                                                                ...prev.sentry,
                                                                dsn: e.target.value,
                                                            },
                                                        }))
                                                    }
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="sentry-org">Organization</Label>
                                                    <Input
                                                        id="sentry-org"
                                                        placeholder="my-org"
                                                        value={form.sentry.organization}
                                                        onChange={(e) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                sentry: {
                                                                    ...prev.sentry,
                                                                    organization: e.target.value,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="sentry-project">Project</Label>
                                                    <Input
                                                        id="sentry-project"
                                                        placeholder="my-app"
                                                        value={form.sentry.project}
                                                        onChange={(e) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                sentry: {
                                                                    ...prev.sentry,
                                                                    project: e.target.value,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sentry-token">
                                                    Auth Token (optional)
                                                </Label>
                                                <Input
                                                    id="sentry-token"
                                                    type="password"
                                                    placeholder="For crash count queries"
                                                    value={form.sentry.authToken}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            sentry: {
                                                                ...prev.sentry,
                                                                authToken: e.target.value,
                                                            },
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Bugsnag Config */}
                                    {provider === 'bugsnag' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="bugsnag-key">API Key</Label>
                                                <Input
                                                    id="bugsnag-key"
                                                    placeholder="32-character hex string"
                                                    value={form.bugsnag.apiKey}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            bugsnag: {
                                                                ...prev.bugsnag,
                                                                apiKey: e.target.value,
                                                            },
                                                        }))
                                                    }
                                                    className="font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bugsnag-project">
                                                    Project ID (optional)
                                                </Label>
                                                <Input
                                                    id="bugsnag-project"
                                                    placeholder="For crash count queries"
                                                    value={form.bugsnag.projectId}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            bugsnag: {
                                                                ...prev.bugsnag,
                                                                projectId: e.target.value,
                                                            },
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Crashlytics Config */}
                                    {provider === 'crashlytics' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="crashlytics-project">
                                                Firebase Project ID
                                            </Label>
                                            <Input
                                                id="crashlytics-project"
                                                placeholder="my-firebase-project"
                                                value={form.crashlytics.projectId}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        crashlytics: {
                                                            ...prev.crashlytics,
                                                            projectId: e.target.value,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createIntegration.isPending || !isFormValid()}
                                    >
                                        {createIntegration.isPending ? 'Adding...' : 'Add'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {/* Info Box */}
                <div className="bg-neutral-50 border border-neutral-200 p-4 mb-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">How it works</h4>
                    <p className="text-sm text-neutral-600">
                        Once configured, the BundleNudge SDK will automatically tag crash
                        reports with{' '}
                        <code className="mx-1 px-1 bg-neutral-200 text-xs rounded">
                            bundlenudge_release_id
                        </code>{' '}
                        and{' '}
                        <code className="mx-1 px-1 bg-neutral-200 text-xs rounded">
                            bundlenudge_bundle_version
                        </code>
                        .
                    </p>
                </div>

                {integrations.length === 0 ? (
                    <div className="py-8 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-neutral-400" />
                        </div>
                        <h4 className="font-semibold text-neutral-900 mb-2">
                            No crash integrations
                        </h4>
                        <p className="text-sm text-neutral-500 mb-4">
                            Connect Sentry, Bugsnag, or Crashlytics to correlate crashes.
                        </p>
                        <Button onClick={() => setDialogOpen(true)}>
                            Add First Integration
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead>Configuration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {integrations.map((integration) => (
                                <TableRow key={integration.id}>
                                    <TableCell className="font-medium capitalize">
                                        {integration.provider}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-500 font-mono">
                                        {integration.provider === 'sentry' &&
                                            (integration.config as Partial<SentryConfig>)
                                                .organization}
                                        {integration.provider === 'bugsnag' &&
                                            (integration.config as Partial<BugsnagConfig>).apiKey}
                                        {integration.provider === 'crashlytics' &&
                                            (integration.config as { projectId?: string })
                                                .projectId}
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() =>
                                                handleToggle(integration.id, !integration.enabled)
                                            }
                                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors rounded ${
                                                integration.enabled
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                            }`}
                                        >
                                            {integration.enabled ? 'Active' : 'Disabled'}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => setDeleteId(integration.id)}
                                            className="text-neutral-400 hover:text-red-600"
                                            title="Delete integration"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <AlertDialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Integration?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Crash reports will no longer be tagged with BundleNudge release
                            data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteIntegration.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
