'use client'

/**
 * WebhooksSection Component
 *
 * Handles webhook configuration for app settings.
 */

import { useState } from 'react'
import { Play, Trash2, Plus } from 'lucide-react'
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
    useWebhooks,
    useCreateWebhook,
    useDeleteWebhook,
    useTestWebhook,
} from '@/hooks/useWebhooks'
import { WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface WebhooksSectionProps {
    accountId: string
    appId: string
}

// =============================================================================
// Component
// =============================================================================

export function WebhooksSection({ accountId, appId }: WebhooksSectionProps) {
    const { toast } = useToast()
    const { data, isLoading } = useWebhooks(accountId, appId)
    const createWebhook = useCreateWebhook(accountId)
    const deleteWebhook = useDeleteWebhook(accountId)
    const testWebhook = useTestWebhook(accountId)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [form, setForm] = useState({
        name: '',
        url: '',
        events: [] as WebhookEvent[],
    })

    const webhooks = data?.webhooks.filter((w) => w.appId === appId) ?? []

    const toggleEvent = (event: WebhookEvent) => {
        setForm((prev) => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter((e) => e !== event)
                : [...prev.events, event],
        }))
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.url || form.events.length === 0) return

        try {
            await createWebhook.mutateAsync({ ...form, appId })
            setForm({ name: '', url: '', events: [] })
            setDialogOpen(false)
            toast({ title: 'Webhook created', variant: 'success' })
        } catch {
            toast({ title: 'Failed to create webhook', variant: 'error' })
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteWebhook.mutateAsync(deleteId)
            setDeleteId(null)
            toast({ title: 'Webhook deleted', variant: 'success' })
        } catch {
            toast({ title: 'Failed to delete webhook', variant: 'error' })
        }
    }

    const handleTest = async (webhookId: string) => {
        try {
            const result = await testWebhook.mutateAsync(webhookId)
            if (result.success) {
                toast({ title: 'Test sent successfully', variant: 'success' })
            } else {
                toast({
                    title: 'Test failed',
                    description: result.error,
                    variant: 'error',
                })
            }
        } catch {
            toast({ title: 'Failed to test webhook', variant: 'error' })
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
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
                        <CardTitle className="text-lg">Webhooks</CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">
                            Get notified when events happen in your app
                        </p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Webhook
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle>Add Webhook</DialogTitle>
                                    <DialogDescription>
                                        Send notifications to a URL when events occur
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="webhook-name">Name</Label>
                                        <Input
                                            id="webhook-name"
                                            placeholder="Production Notifications"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm({ ...form, name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="webhook-url">URL</Label>
                                        <Input
                                            id="webhook-url"
                                            placeholder="https://your-server.com/webhook"
                                            value={form.url}
                                            onChange={(e) =>
                                                setForm({ ...form, url: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Events</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {WEBHOOK_EVENTS.map((event) => (
                                                <label
                                                    key={event.value}
                                                    className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors rounded ${
                                                        form.events.includes(event.value)
                                                            ? 'border-neutral-900 bg-neutral-50'
                                                            : 'border-neutral-200 hover:border-neutral-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={form.events.includes(event.value)}
                                                        onChange={() => toggleEvent(event.value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-sm">{event.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
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
                                        disabled={
                                            createWebhook.isPending ||
                                            !form.name ||
                                            !form.url ||
                                            form.events.length === 0
                                        }
                                    >
                                        {createWebhook.isPending ? 'Creating...' : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {webhooks.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">
                        No webhooks configured
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Events</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {webhooks.map((webhook) => (
                                <TableRow key={webhook.id}>
                                    <TableCell className="font-medium">
                                        {webhook.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-500">
                                        {webhook.events.length} event
                                        {webhook.events.length !== 1 ? 's' : ''}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                                                webhook.enabled
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-neutral-100 text-neutral-500'
                                            }`}
                                        >
                                            {webhook.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleTest(webhook.id)}
                                                className="text-neutral-400 hover:text-neutral-900"
                                                title="Test webhook"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(webhook.id)}
                                                className="text-neutral-400 hover:text-red-600"
                                                title="Delete webhook"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
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
                        <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. You will no longer receive
                            notifications for this webhook.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteWebhook.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
