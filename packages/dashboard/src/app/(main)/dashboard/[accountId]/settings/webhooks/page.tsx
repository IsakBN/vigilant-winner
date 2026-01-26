'use client'

/**
 * Webhooks Page
 *
 * Manage webhook endpoints for event notifications.
 */

import { useParams } from 'next/navigation'
import { useState } from 'react'
import {
    useWebhooks,
    useCreateWebhook,
    useUpdateWebhook,
    useDeleteWebhook,
    useTestWebhook,
} from '@/hooks/useWebhooks'
import { WebhookForm, type WebhookFormData } from '@/components/settings'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreVertical, Pencil, Trash, PlayCircle } from 'lucide-react'
import type { Webhook } from '@/lib/api'

export default function WebhooksPage() {
    const params = useParams()
    const accountId = params.accountId as string

    const [showForm, setShowForm] = useState(false)
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null)

    const { data, isLoading } = useWebhooks(accountId)
    const createWebhook = useCreateWebhook(accountId)
    const updateWebhook = useUpdateWebhook(accountId)
    const deleteWebhook = useDeleteWebhook(accountId)
    const testWebhook = useTestWebhook(accountId)

    const webhooks = data?.webhooks ?? []

    const handleCreate = async (formData: WebhookFormData) => {
        await createWebhook.mutateAsync(formData)
        setShowForm(false)
    }

    const handleUpdate = async (formData: WebhookFormData) => {
        if (!editingWebhook) return
        await updateWebhook.mutateAsync({
            webhookId: editingWebhook.id,
            data: formData,
        })
        setEditingWebhook(null)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        await deleteWebhook.mutateAsync(deleteTarget.id)
        setDeleteTarget(null)
    }

    const handleToggleEnabled = async (webhook: Webhook) => {
        await updateWebhook.mutateAsync({
            webhookId: webhook.id,
            data: { enabled: !webhook.enabled },
        })
    }

    if (isLoading) {
        return <WebhooksSkeleton />
    }

    if (showForm || editingWebhook) {
        return (
            <WebhookForm
                webhook={editingWebhook ?? undefined}
                isLoading={createWebhook.isPending || updateWebhook.isPending}
                onSubmit={editingWebhook ? handleUpdate : handleCreate}
                onCancel={() => {
                    setShowForm(false)
                    setEditingWebhook(null)
                }}
            />
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Webhooks</CardTitle>
                            <CardDescription>
                                Receive HTTP callbacks when events occur
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Webhook
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {webhooks.length === 0 ? (
                <EmptyState onAdd={() => setShowForm(true)} />
            ) : (
                <div className="space-y-4">
                    {webhooks.map((webhook) => (
                        <WebhookCard
                            key={webhook.id}
                            webhook={webhook}
                            onEdit={() => setEditingWebhook(webhook)}
                            onDelete={() => setDeleteTarget(webhook)}
                            onTest={() => testWebhook.mutate(webhook.id)}
                            onToggle={() => handleToggleEnabled(webhook)}
                            isTestLoading={testWebhook.isPending}
                        />
                    ))}
                </div>
            )}

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;
                            {deleteTarget?.name}&quot;? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground"
                        >
                            {deleteWebhook.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

interface WebhookCardProps {
    webhook: Webhook
    onEdit: () => void
    onDelete: () => void
    onTest: () => void
    onToggle: () => void
    isTestLoading: boolean
}

function WebhookCard({
    webhook,
    onEdit,
    onDelete,
    onTest,
    onToggle,
    isTestLoading,
}: WebhookCardProps) {
    const lastTriggered = webhook.lastTriggeredAt
        ? new Date(webhook.lastTriggeredAt * 1000).toLocaleDateString()
        : 'Never'

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium">{webhook.name}</h3>
                            <Badge
                                variant={
                                    webhook.enabled ? 'default' : 'secondary'
                                }
                            >
                                {webhook.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                            {webhook.failureCount > 0 && (
                                <Badge variant="destructive">
                                    {webhook.failureCount} failures
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {webhook.url}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {webhook.events.map((event) => (
                                <Badge key={event} variant="outline">
                                    {event}
                                </Badge>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Last triggered: {lastTriggered}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={webhook.enabled}
                            onCheckedChange={onToggle}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={onTest}
                                    disabled={isTestLoading}
                                >
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Test
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="text-destructive"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                    No webhooks configured yet
                </p>
                <Button className="mt-4" onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Webhook
                </Button>
            </CardContent>
        </Card>
    )
}

function WebhooksSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="mt-1 h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
            </Card>
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="mt-2 h-4 w-64" />
                        <div className="mt-2 flex gap-1">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
