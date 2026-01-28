'use client'

/**
 * Webhooks Settings Page
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
    type Webhook,
} from '@/hooks/useWebhooks'
import {
    WebhookForm,
    WebhookCard,
    WebhooksSettingsSkeleton,
    DeleteWebhookDialog,
    WebhooksEmptyState,
    type WebhookFormData,
} from '@/components/settings'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
} from '@bundlenudge/shared-ui'
import { Plus } from 'lucide-react'

export default function WebhooksSettingsPage() {
    const params = useParams()
    const accountId = params.accountId as string

    const [showForm, setShowForm] = useState(false)
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null)

    const { webhooks, isLoading } = useWebhooks(accountId)
    const createWebhook = useCreateWebhook(accountId)
    const updateWebhook = useUpdateWebhook(accountId)
    const deleteWebhook = useDeleteWebhook(accountId)
    const testWebhook = useTestWebhook(accountId)

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
        return <WebhooksSettingsSkeleton />
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
                <WebhooksEmptyState onAdd={() => setShowForm(true)} />
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

            <DeleteWebhookDialog
                webhook={deleteTarget}
                isDeleting={deleteWebhook.isPending}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
